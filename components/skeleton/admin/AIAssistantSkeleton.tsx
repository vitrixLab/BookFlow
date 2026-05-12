// components/skeleton/admin/AIAssistantSkeleton.tsx
import Skeleton from '../Skeleton'

export default function AdminAIAssistantSkeleton() {
  return (
    <main className="main-content">
      <div className="ai-fullpage" style={{ height: '420px' }}>
        {/* Header */}
        <header className="ai-header" style={{ display: 'flex', flexDirection: 'column' }}>
          <Skeleton width="220px" height="2rem" borderRadius="8px" style={{ marginBottom: '0.3rem' }} />
          <Skeleton width="300px" height="1rem" borderRadius="6px" />
        </header>

        {/* Chat Panel */}
        <div className="ai-chat-panel">
          {/* Messages area */}
          <div className="ai-messages" style={{ height: '180px', overflow: 'visible' }}>
            {/* Incoming message (assistant) */}
            <div className="ai-msg ai-msg--assistant">
              <Skeleton width="70%" height="3rem" borderRadius="18px" />
            </div>
            {/* Outgoing message (user) */}
            <div className="ai-msg ai-msg--user">
              <Skeleton width="50%" height="2.5rem" borderRadius="18px" />
            </div>
            {/* Incoming message */}
            <div className="ai-msg ai-msg--assistant">
              <Skeleton width="80%" height="4rem" borderRadius="18px" />
            </div>
            {/* Outgoing message */}
            <div className="ai-msg ai-msg--user">
              <Skeleton width="60%" height="2rem" borderRadius="18px" />
            </div>
            {/* Incoming (short) */}
            <div className="ai-msg ai-msg--assistant">
              <Skeleton width="40%" height="1.5rem" borderRadius="18px" />
            </div>
          </div>

          {/* Input area */}
          <div className="ai-input-area">
            <Skeleton width="100%" height="2.8rem" borderRadius="12px" style={{ flex: 1 }} />
            <Skeleton width="42px" height="42px" borderRadius="50%" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .ai-fullpage {
          max-width: 900px; margin: 0 auto; height: calc(100vh - 64px - 4rem);
          display: flex; flex-direction: column;
        }
        .ai-header {
          margin-bottom: 1.5rem;
          text-align: center;
          display: flex;              /* required for vertical/horizontal flex centering */
          align-items: center;        /* fixed typo */
          justify-content: center;
        }
        .ai-chat-panel {
          flex: 1; background: #fff; border-radius: 16px; border: 1px solid #ebebeb;
          display: flex; flex-direction: column; overflow: hidden;  max-height: 70%;
        }
        .ai-messages {
          flex: 1; overflow-y: auto; padding: 1.5rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .ai-msg {
          max-width: 70%; display: flex; flex-direction: column;
        }
        .ai-msg--assistant {
          align-self: flex-start;
        }
        .ai-msg--user {
          align-self: flex-end; align-items: flex-end;
        }
        .ai-input-area {
          padding: 1rem 1.5rem; border-top: 1px solid #f0f0f0;
          display: flex; gap: 0.75rem; align-items: center;
        }
      `}</style>
    </main>
  )
}