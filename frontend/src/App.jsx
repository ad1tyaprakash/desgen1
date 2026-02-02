import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  onSnapshot,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, db, provider } from './firebase'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [runs, setRuns] = useState([])
  const [activeRun, setActiveRun] = useState(null)

  const runId = useMemo(() => {
    if (activeRun) {
      return activeRun
    }
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `run_${Date.now()}`
  }, [activeRun])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser) {
        setRuns([])
        setMessages([])
        setActiveRun(null)
        setPrompt('')
        return
      }

      const runsQuery = query(
        collection(db, 'designRuns'),
        where('uid', '==', nextUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      )

      const snapshot = await getDocs(runsQuery)
      const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setRuns(results)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || !activeRun) {
      return
    }

    const messagesQuery = query(
      collection(db, 'chatLogs'),
      where('uid', '==', user.uid),
      where('runId', '==', activeRun),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      if (results.length) {
        setMessages(results)
      }
    })

    return () => unsubscribe()
  }, [activeRun, user])

  const handleGenerate = async (event) => {
    event.preventDefault()
    setError('')

    if (!user) {
      setError('Sign in with Google to generate outputs and save runs.')
      return
    }

    setLoading(true)

    try {
      const userMessage = {
        uid: user.uid,
        runId,
        role: 'user',
        content: prompt,
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(db, 'chatLogs'), userMessage)

      const response = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('Backend not available yet.')
      }

      const data = await response.json()
      const assistantMessages = [
        {
          uid: user.uid,
          runId,
          role: 'assistant',
          label: 'Product plan',
          content: data.product_plan,
          createdAt: serverTimestamp(),
        },
        {
          uid: user.uid,
          runId,
          role: 'assistant',
          label: 'UX design',
          content: data.ux_design,
          createdAt: serverTimestamp(),
        },
        {
          uid: user.uid,
          runId,
          role: 'assistant',
          label: 'Visual design',
          content: data.visual_design,
          createdAt: serverTimestamp(),
        },
      ]

      for (const message of assistantMessages) {
        await addDoc(collection(db, 'chatLogs'), message)
      }

      const docRef = await addDoc(collection(db, 'designRuns'), {
        uid: user.uid,
        runId,
        prompt,
        createdAt: serverTimestamp(),
      })

      setRuns((prev) => [
        { id: docRef.id, runId, prompt, createdAt: new Date() },
        ...prev,
      ])
    } catch (err) {
      setError(err.message || 'Unable to reach the backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="nav">
        <div className="logo">Desgen</div>
        <nav className="nav-links">
          <a href="#dashboard">Dashboard</a>
        </nav>
        <div className="nav-actions">
          {user ? (
            <div className="user-chip">
              <span>{user.displayName || user.email}</span>
              <button className="ghost" onClick={() => signOut(auth)}>
                Sign out
              </button>
            </div>
          ) : (
            <button className="ghost" onClick={() => signInWithPopup(auth, provider)}>
              Sign in with Google
            </button>
          )}
          <button className="primary">Get started</button>
        </div>
      </header>

      <main>
        {!user ? (
          <section className="home">
            <div className="home-card">
              <p className="eyebrow">Desgen</p>
              <h1>Sign in to access your design dashboard.</h1>
              <p className="subhead">
                Your runs, prompts, and outputs are private to your account.
              </p>
              <button className="primary" onClick={() => signInWithPopup(auth, provider)}>
                Sign in with Google
              </button>
            </div>
          </section>
        ) : (
          <section id="dashboard" className="dashboard">
            <div className="section-title">
              <h2>Design dashboard</h2>
              <p>Submit a prompt and review the product, UX, and visual outputs in a chat-style log.</p>
            </div>
            <div className="dashboard-grid">
              <aside className="runs-panel">
                <div className="runs-header">
                  <h3>Runs</h3>
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => {
                      setActiveRun(null)
                      setMessages([])
                      setPrompt('')
                    }}
                  >
                    New run
                  </button>
                </div>
                <div className="runs-list">
                  {runs.length ? (
                    runs.map((run) => (
                      <button
                        key={run.id}
                        type="button"
                        className={`run-item ${run.runId === activeRun ? 'active' : ''}`}
                        onClick={() => {
                          setActiveRun(run.runId)
                          setPrompt(run.prompt)
                        }}
                      >
                        <span>{run.prompt}</span>
                        <small>{run.runId?.slice(0, 8)}</small>
                      </button>
                    ))
                  ) : (
                    <p className="helper">No saved runs yet.</p>
                  )}
                </div>
              </aside>

              <div className="chat-panel">
                <div className="chat-log">
                  {messages.length ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`chat-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
                      >
                        {message.label ? <span className="bubble-label">{message.label}</span> : null}
                        <p>{message.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="helper">Your outputs will appear here.</p>
                  )}
                </div>

                <form className="prompt-form" onSubmit={handleGenerate}>
                  <div>
                    <label htmlFor="prompt">Project prompt</label>
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      rows={4}
                      placeholder="Describe your SaaS idea..."
                    />
                  </div>
                  <div className="prompt-actions">
                    {error ? <p className="error">{error}</p> : null}
                    <button className="primary" type="submit" disabled={loading || !prompt.trim()}>
                      {loading ? 'Generating…' : 'Generate output'}
                    </button>
                  </div>
                  <p className="helper">
                    Outputs and logs are stored in Firestore per run, like a chat history.
                  </p>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div>
          <h4>Desgen</h4>
          <p>AI design dashboard</p>
        </div>
        <div className="footer-meta">© 2026 Desgen. All rights reserved.</div>
      </footer>
    </div>
  )
}

export default App
