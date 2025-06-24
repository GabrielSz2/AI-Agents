import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_email, agent_id, message, assistant_id } = await req.json()

    console.log(`🤖 Edge Function - Processando para Assistant ID: ${assistant_id}`)
    console.log(`👤 Usuário: ${user_email}`)
    console.log(`🆔 Agent ID: ${agent_id}`)
    console.log(`💬 Mensagem: ${message}`)

    // Inicializar Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar API key da OpenAI no banco
    const { data: configData, error: configError } = await supabaseClient
      .from('system_config')
      .select('value')
      .eq('key', 'openai_api_key')
      .single()

    if (configError || !configData?.value) {
      console.error('❌ OpenAI API key não configurada:', configError)
      throw new Error('OpenAI API key não configurada')
    }

    const OPENAI_API_KEY = configData.value
    console.log('✅ API key encontrada')

    // Verificar se já existe uma thread ativa
    const { data: existingThread, error: threadError } = await supabaseClient
      .from('user_threads')
      .select('*')
      .eq('user_email', user_email)
      .eq('agent_id', agent_id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    let thread_id = existingThread?.thread_id

    // Se não existir thread ativa, criar uma nova
    if (!thread_id) {
      console.log('🆕 Criando nova thread...')
      
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      })

      if (!threadRes.ok) {
        const errorText = await threadRes.text()
        console.error('❌ Erro ao criar thread:', errorText)
        throw new Error(`Erro ao criar thread: ${threadRes.status} - ${errorText}`)
      }

      const threadData = await threadRes.json()
      thread_id = threadData.id
      console.log(`✅ Thread criada: ${thread_id}`)

      // Salvar thread no banco
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas padrão

      await supabaseClient
        .from('user_threads')
        .insert({
          user_email,
          agent_id,
          thread_id,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
    } else {
      console.log(`♻️ Usando thread existente: ${thread_id}`)
    }

    // Adicionar mensagem do usuário à thread
    console.log('📝 Adicionando mensagem à thread...')
    
    const messageRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: message
      })
    })

    if (!messageRes.ok) {
      const errorText = await messageRes.text()
      console.error('❌ Erro ao adicionar mensagem:', errorText)
      throw new Error(`Erro ao adicionar mensagem: ${messageRes.status} - ${errorText}`)
    }

    console.log('✅ Mensagem adicionada à thread')

    // Executar o assistant
    console.log(`🚀 Executando assistant ${assistant_id}...`)
    
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id
      })
    })

    if (!runRes.ok) {
      const errorText = await runRes.text()
      console.error('❌ Erro ao executar assistant:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (parseError) {
        console.error('Erro ao fazer parse do erro:', parseError)
        errorData = { error: { message: errorText } }
      }
      
      // Se o assistant não existe (404), retornar erro específico para fallback
      if (runRes.status === 404 && errorData.error?.message?.includes('No assistant found')) {
        console.warn(`⚠️ Assistant não encontrado: ${assistant_id}`)
        return new Response(
          JSON.stringify({
            error: 'ASSISTANT_NOT_FOUND',
            message: 'Assistant ID inválido ou não encontrado',
            fallback_required: true,
            assistant_id: assistant_id
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      throw new Error(`Erro ao executar assistant: ${runRes.status} - ${errorText}`)
    }

    const run = await runRes.json()
    console.log(`✅ Run iniciado: ${run.id}`)

    if (run.error) {
      console.error('❌ Falha ao iniciar run:', run.error)
      throw new Error(`Falha ao iniciar run: ${JSON.stringify(run.error)}`)
    }

    // Aguardar conclusão da execução
    let status = 'queued'
    let attempts = 0
    const maxAttempts = 30 // 30 segundos máximo

    console.log('⏳ Aguardando conclusão da execução...')

    while (status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++

      const checkRunRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      })

      if (!checkRunRes.ok) {
        console.error(`❌ Erro ao verificar status: ${checkRunRes.status}`)
        throw new Error(`Erro ao verificar status: ${checkRunRes.status}`)
      }

      const runData = await checkRunRes.json()
      status = runData.status

      console.log(`📊 Status da execução (tentativa ${attempts}): ${status}`)

      if (status === 'failed') {
        console.error('❌ Run falhou:', runData.last_error)
        throw new Error(`Run falhou: ${JSON.stringify(runData.last_error)}`)
      }

      if (status === 'expired') {
        console.error('⏰ Run expirou')
        throw new Error('Run expirou - tempo limite excedido')
      }
    }

    if (status !== 'completed') {
      console.error('⏰ Timeout na execução')
      throw new Error('Timeout - execução não foi concluída no tempo esperado')
    }

    console.log('✅ Execução concluída, buscando resposta...')

    // Buscar a resposta do assistant
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    if (!messagesRes.ok) {
      console.error(`❌ Erro ao buscar mensagens: ${messagesRes.status}`)
      throw new Error(`Erro ao buscar mensagens: ${messagesRes.status}`)
    }

    const messages = await messagesRes.json()
    
    // Filtrar mensagens do assistant e pegar a mais recente
    const assistantMessages = messages.data
      .filter((m: any) => m.role === 'assistant')
      .sort((a: any, b: any) => b.created_at - a.created_at)

    const lastMessage = assistantMessages[0]?.content?.[0]?.text?.value || 'Erro ao buscar resposta.'

    console.log(`💬 Resposta obtida: ${lastMessage.substring(0, 100)}...`)

    // Salvar mensagem no banco
    await supabaseClient
      .from('mensagens')
      .insert({
        user_email,
        agent_id,
        content: lastMessage,
        is_from_user: false,
        thread_id,
        openai_message_id: assistantMessages[0]?.id
      })

    console.log('✅ Resposta salva no banco')

    return new Response(
      JSON.stringify({
        resposta: lastMessage,
        thread_id,
        run_id: run.id,
        assistant_id: assistant_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Erro na edge function:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})