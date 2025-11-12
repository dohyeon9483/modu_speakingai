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

<div class="flex flex-col h-full overflow-y-auto px-4 py-6 space-y-4 message-list-container">
    {#if messages.length === 0}
        <div class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
                <div class="text-4xl mb-2">💬</div>
                <p class="text-sm">대화를 시작해보세요!</p>
            </div>
        </div>
    {:else}
        {#each messages as message (message.id)}
            <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="flex items-start gap-3 max-w-[80%] md:max-w-[70%]">
                    {#if message.role === 'assistant'}
                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                            🤖
                        </div>
                    {/if}
                    
                    <div class="flex flex-col gap-1">
                        <div class="px-4 py-3 rounded-2xl shadow-sm {
                            message.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                                : 'bg-white text-gray-800 border border-gray-200'
                        }">
                            <p class="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <span class="text-xs text-gray-500 px-1 {
                            message.role === 'user' ? 'text-right' : 'text-left'
                        }">
                            {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </span>
                    </div>

                    {#if message.role === 'user'}
                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
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
        scrollbar-color: #cbd5e1 #f1f5f9;
    }
    
    :global(.message-list-container::-webkit-scrollbar) {
        width: 6px;
    }
    
    :global(.message-list-container::-webkit-scrollbar-track) {
        background: #f1f5f9;
        border-radius: 10px;
    }
    
    :global(.message-list-container::-webkit-scrollbar-thumb) {
        background: #cbd5e1;
        border-radius: 10px;
    }
    
    :global(.message-list-container::-webkit-scrollbar-thumb:hover) {
        background: #94a3b8;
    }
</style>

