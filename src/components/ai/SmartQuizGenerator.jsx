import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiX, FiCheckCircle } from 'react-icons/fi';

const SmartQuizGenerator = ({ onGenerate, onClose }) => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionCount, setQuestionCount] = useState(5);
    const [type, setType] = useState('Multiple Choice');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) {
            toast.error('Topic is required');
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('t_token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/quiz/generate`, {
                topic,
                difficulty,
                questionCount: parseInt(questionCount),
                type
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.questions && Array.isArray(res.data.questions)) {
                toast.success('Quiz generated successfully!');
                onGenerate(res.data.questions);
            } else {
                toast.error('Failed to parse questions');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error generating quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="card modal-box" style={{ maxWidth: 500, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, color: '#4f46e5', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiCheckCircle /> AI Quiz Generator
                    </h3>
                    <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><FiX size={18} /></button>
                </div>

                <form onSubmit={handleGenerate}>
                    <div className="form-group">
                        <label>Topic / Concept *</label>
                        <input 
                            placeholder="e.g. React Hooks, JavaScript Promises" 
                            value={topic} 
                            onChange={e => setTopic(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group">
                            <label>Difficulty</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                <option>Beginner</option>
                                <option>Medium</option>
                                <option>Advanced</option>
                                <option>Expert</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Number of Questions</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="15"
                                value={questionCount} 
                                onChange={e => setQuestionCount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Question Style</label>
                        <select value={type} onChange={e => setType(e.target.value)}>
                            <option>Multiple Choice (Standard)</option>
                            <option>Scenario Based (Practical)</option>
                            <option>Code Analysis (Debugging)</option>
                            <option>True/False (Conceptual)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? <><span className="spinner spinner-xs" /> Generating...</> : 'Generate with AI'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SmartQuizGenerator;
