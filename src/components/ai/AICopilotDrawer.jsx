import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner, FaCopy, FaEdit, FaCheck } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './AICopilotDrawer.css';

const AICopilotDrawer = ({ courseId, sessionId, courseTitle, sessionTitle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && courseId && sessionId) {
            fetchHistory();
        }
    }, [isOpen, courseId, sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchHistory = async () => {
        try {
            const token = sessionStorage.getItem('s_token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/ai/copilot/history/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.messages) {
                setMessages(res.data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const clearHistory = async () => {
        try {
            const token = sessionStorage.getItem('s_token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/ai/copilot/history/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([]);
            toast.success('Chat history cleared');
        } catch (error) {
            toast.error('Failed to clear history');
        }
    };

    const sendMessage = async (messageText = input) => {
        if (!messageText.trim() || loading) return;

        const userMsg = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const token = sessionStorage.getItem('s_token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/copilot`, {
                courseId,
                sessionId,
                message: messageText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const aiMsg = { role: 'model', content: res.data.reply };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to get response');
            setMessages(prev => [...prev, { role: 'model', content: '**Error**: Could not fetch response. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
        toast.success("Text copied to clipboard!");
    };

    const handleEdit = (text) => {
        setInput(text);
        toast("Message ready to edit", { icon: '📝' });
    };

    const quickPrompts = [
        "Explain this simply",
        "Give me an example",
        "Summarize this lesson",
        "Give me practice questions",
        "Help me debug this code"
    ];

    return (
        <>
            <button className={`ai-fab ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)} title="Open SMD AI Learning">
                <FaRobot size={28} />
            </button>

            <div className={`ai-drawer ${isOpen ? 'open' : ''}`}>
                <div className="ai-drawer-header">
                    <div className="header-title">
                        <FaRobot size={24} />
                        <h3>SMD AI Learning</h3>
                    </div>
                    <div className="header-actions">
                        <button className="clear-btn" onClick={clearHistory} title="Clear Chat">Clear</button>
                        <button className="close-btn" onClick={() => setIsOpen(false)}><FaTimes /></button>
                    </div>
                </div>

                <div className="ai-drawer-content">
                    {messages.length === 0 && (
                        <div className="ai-welcome">
                            <p>Hi! I'm <strong>SMD AI Learning</strong>. Ask me anything about <strong>{sessionTitle}</strong>.</p>
                            <div className="quick-prompts">
                                {quickPrompts.map(prompt => (
                                    <button key={prompt} onClick={() => sendMessage(prompt)} className="quick-prompt-btn">
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`ai-message ${msg.role === 'user' ? 'user-msg' : 'model-msg'}`}>
                            <div className="msg-bubble">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            <div className="msg-actions">
                                {msg.role === 'model' && (
                                    <button className="icon-btn" onClick={() => handleCopy(msg.content, idx)} title="Copy Text">
                                        {copiedIdx === idx ? <FaCheck color="green" /> : <FaCopy />} 
                                    </button>
                                )}
                                {msg.role === 'user' && (
                                    <button className="icon-btn" onClick={() => handleEdit(msg.content)} title="Edit Message">
                                        <FaEdit />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="ai-message model-msg">
                            <div className="msg-bubble loading">
                                <FaSpinner className="spinner" /> Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="ai-drawer-footer">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Ask a question..."
                        rows={1}
                    />
                    <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="send-btn">
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </>
    );
};

export default AICopilotDrawer;
