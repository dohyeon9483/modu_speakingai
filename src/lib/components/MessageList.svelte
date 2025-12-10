<script>
    import { realtimeStore } from '$lib/stores/realtimeStore.js';

    const messages = $derived($realtimeStore.messages || []);
    let messagesEndRef = $state(null);

    // 메시지가 추가될 때 자동으로 스크롤
    $effect(() => {
        if (messagesEndRef && messages.length > 0) {
            setTimeout(() => {
                messagesEndRef?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    });
</script>

<div class="flex flex-col h-full overflow-y-auto px-5 py-6 space-y-5 message-list-container">
    {#if messages.length === 0}
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl">
                    💬
                </div>
                <p class="text-gray-500 font-medium">대화를 시작해보세요!</p>
                <p class="text-sm text-gray-400 mt-1">메시지를 입력하거나 음성 대화를 시작하세요</p>
            </div>
        </div>
    {:else}
        {#each messages as message (message.id)}
            <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="flex items-start gap-3 max-w-[80%] md:max-w-[70%]">
                    {#if message.role === 'assistant'}
                        <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-sm">
                            🤖
                        </div>
                    {/if}
                    
                    <div class="flex flex-col gap-1.5">
                        <div class="px-4 py-3 rounded-2xl {
                            message.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md' 
                                : 'bg-gray-50 text-gray-900 border border-gray-100 shadow-sm'
                        }">
                            <p class="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                        </div>
                        <span class="text-xs text-gray-400 px-1.5 {
                            message.role === 'user' ? 'text-right' : 'text-left'
                        }">
                            {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </span>
                    </div>

                    {#if message.role === 'user'}
                        <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-base shadow-sm">
                            👤
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    {/if}
    
    <div bind:this={messagesEndRef}></div>
</div>

<style>
    :global(.message-list-container) {
        scrollbar-width: thin;
        scrollbar-color: #e2e8f0 #f8fafc;
    }
    
    :global(.message-list-container::-webkit-scrollbar) {
        width: 6px;
    }
    
    :global(.message-list-container::-webkit-scrollbar-track) {
        background: #f8fafc;
        border-radius: 10px;
    }
    
    :global(.message-list-container::-webkit-scrollbar-thumb) {
        background: #e2e8f0;
        border-radius: 10px;
    }
    
    :global(.message-list-container::-webkit-scrollbar-thumb:hover) {
        background: #cbd5e1;
    }
</style>

