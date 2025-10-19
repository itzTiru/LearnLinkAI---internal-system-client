'use client';
import { useState, useEffect } from 'react';
import { Search, Zap, Filter, X, Map, Award, Clock, BookOpen, ExternalLink, TrendingUp, CheckCircle, Check } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') : 'http://127.0.0.1:8000';

export default function RoadmapPage() {
    const [categories, setCategories] = useState({ role_based: [], skill_based: [] });
    const [selectedCategory, setSelectedCategory] = useState('role_based');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [isCustomDomain, setIsCustomDomain] = useState(false);
    const [customDomain, setCustomDomain] = useState('');
    const [skillLevel, setSkillLevel] = useState('beginner');
    const [customPreferences, setCustomPreferences] = useState('');
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    //  NEW PROGRESS TRACKING STATES
    const [progress, setProgress] = useState({});
    const [totalCompleted, setTotalCompleted] = useState(0);
    //  NEW MODAL STATE
    const [selectedItem, setSelectedItem] = useState(null); // Changed from selectedNode to selectedItem for flexibility

    useEffect(() => {
        fetchCategories();
        //  LOAD SAVED PROGRESS
        if (roadmap?.domain) {
            const savedProgress = localStorage.getItem(`roadmap_progress_${roadmap.domain}`);
            if (savedProgress) {
                const parsed = JSON.parse(savedProgress);
                setProgress(parsed);
                setTotalCompleted(Object.values(parsed).filter(Boolean).length);
            }
        }
    }, [roadmap?.domain]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE}/roadmap/categories`);
            const data = await response.json();
            setCategories(data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    // NEW SAVE PROGRESS FUNCTION
    const saveProgress = (itemId, isCompleted) => {
        const newProgress = { ...progress, [itemId]: isCompleted };
        setProgress(newProgress);
        setTotalCompleted(Object.values(newProgress).filter(Boolean).length);

        // SAVE TO LOCALSTORAGE
        localStorage.setItem(
            `roadmap_progress_${roadmap.domain}`,
            JSON.stringify(newProgress)
        );
    };

    const handleGenerateRoadmap = async (e) => {
        e.preventDefault();
        const domainToUse = isCustomDomain ? customDomain : selectedDomain;
        if (!domainToUse) {
            setError('Please select or enter a domain');
            return;
        }

        setLoading(true);
        setError(null);
        setRoadmap(null);

        try {
            const response = await fetch(`${API_BASE}/roadmap/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: domainToUse,
                    category: selectedCategory,
                    skill_level: skillLevel,
                    custom_preferences: customPreferences || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate roadmap');
            }

            const data = await response.json();
            setRoadmap(data);
            //  RESET PROGRESS FOR NEW ROADMAP
            setProgress({});
            setTotalCompleted(0);
            localStorage.removeItem(`roadmap_progress_${data.domain}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setRoadmap(null);
        setSelectedDomain('');
        setIsCustomDomain(false);
        setCustomDomain('');
        setCustomPreferences('');
        setError(null);
        setProgress({});
        setTotalCompleted(0);
    };

    const filteredDomains = categories[selectedCategory]?.filter(domain =>
        domain.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getLevelColor = (level) => {
        const colors = {
            1: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
            2: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
            3: { bg: '#e9d5ff', border: '#8b5cf6', text: '#6b21a8' },
            4: { bg: '#fce7f3', border: '#ec4899', text: '#9f1239' },
            5: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }
        };
        return colors[level] || colors[2];
    };

    //  UPDATED ROADMAP NODE - CLICKABLE SUBTOPICS
    const RoadmapNode = ({ node, index }) => {
        const hasSubtopics = node.key_topics && node.key_topics.length > 0;
        const levelColors = getLevelColor(node.level);
        const isCompleted = node.key_topics ? node.key_topics.every((_, idx) => progress[`${node.id}_subtopic_${idx}`]) : progress[node.id];

        return (
            <div
                style={{
                    display: 'flex',
                    gap: '24px',
                    marginBottom: '24px',
                    alignItems: 'flex-start',
                    opacity: isCompleted ? 0.7 : 1,
                    backgroundColor: isCompleted ? '#f0fdf4' : 'white'
                }}
            >
                {/* Main Node Card */}
                <div style={{
                    minWidth: '280px',
                    maxWidth: '280px',
                    padding: '20px',
                    backgroundColor: isCompleted ? '#f0fdf4' : 'white',
                    borderRadius: '12px',
                    border: `3px solid ${levelColors.border}`,
                    boxShadow: isCompleted ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 4px 12px rgba(0,0,0,0.08)',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '16px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: levelColors.bg,
                        color: levelColors.text,
                        border: `2px solid ${levelColors.border}`
                    }}>
                        Level {node.level}
                    </div>

                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: isCompleted ? '#16a34a' : '#111827',
                        marginTop: '8px',
                        marginBottom: '12px',
                        lineHeight: '1.4',
                        textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                        {node.title}
                    </h3>

                    <p style={{
                        color: isCompleted ? '#22c55e' : '#6b7280',
                        fontSize: '13px',
                        marginBottom: '12px',
                        lineHeight: '1.5'
                    }}>
                        {node.description}
                    </p>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: isCompleted ? '#16a34a' : '#3b82f6',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        <Clock size={16} />
                        {node.estimated_time_hours} hours
                        {isCompleted && <CheckCircle size={16} />}
                    </div>
                </div>

                {/* Connector Arrow */}
                {hasSubtopics && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingTop: '40px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '3px',
                            backgroundColor: '#e5e7eb',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                right: '-8px',
                                top: '-5px',
                                width: '0',
                                height: '0',
                                borderTop: '6px solid transparent',
                                borderBottom: '6px solid transparent',
                                borderLeft: '8px solid #e5e7eb'
                            }} />
                        </div>
                    </div>
                )}

                {/* Subtopics Grid - NOW CLICKABLE */}
                {hasSubtopics && (
                    <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '12px',
                        paddingTop: '20px'
                    }}>
                        {node.key_topics.map((topic, idx) => {
                            const subtopicId = `${node.id}_subtopic_${idx}`;
                            const isSubtopicCompleted = progress[subtopicId];

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedItem({ id: subtopicId, title: topic, type: 'subtopic' })}
                                    style={{
                                        padding: '12px 16px',
                                        backgroundColor: isSubtopicCompleted ? '#dcfce7' : '#fef3c7',
                                        border: `2px solid ${isSubtopicCompleted ? '#22c55e' : '#fbbf24'}`,
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: isSubtopicCompleted ? '#166534' : '#78350f',
                                        lineHeight: '1.4',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {topic}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // HANDLE ITEM OPTIONS (NODE OR SUBTOPIC)
    const handleMarkComplete = () => {
        if (selectedItem) {
            const isCompleted = !progress[selectedItem.id];
            saveProgress(selectedItem.id, isCompleted);
            setSelectedItem(null);
        }
    };

    const handleSearch = () => {
        if (selectedItem) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedItem.title)}`, '_blank');
            setSelectedItem(null);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
                        }}>
                            <Map size={32} color="white" />
                        </div>
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
                        AI Roadmap Generator
                    </h1>
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>
                        Get a personalized learning path powered by AI
                    </p>
                </div>

                {/* Form */}
                {!roadmap && !loading && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                        border: '1px solid #f3f4f6',
                        maxWidth: '1024px',
                        margin: '0 auto'
                    }}>
                        {/* Category Selection */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '16px'
                            }}>
                                <Filter size={20} color="#3b82f6" />
                                Select Category Type
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('role_based');
                                        setSelectedDomain('');
                                        setIsCustomDomain(false);
                                    }}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: selectedCategory === 'role_based' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                        backgroundColor: selectedCategory === 'role_based' ? '#eff6ff' : 'white',
                                        color: selectedCategory === 'role_based' ? '#1e40af' : '#374151',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Role-Based ({categories.role_based?.length || 0})
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('skill_based');
                                        setSelectedDomain('');
                                        setIsCustomDomain(false);
                                    }}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: selectedCategory === 'skill_based' ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                                        backgroundColor: selectedCategory === 'skill_based' ? '#f3e8ff' : 'white',
                                        color: selectedCategory === 'skill_based' ? '#6b21a8' : '#374151',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Skill-Based ({categories.skill_based?.length || 0})
                                </button>
                            </div>
                        </div>

                        {/* Domain Selection */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '16px'
                            }}>
                                <Search size={20} color="#3b82f6" />
                                Choose Your Domain
                            </label>
                            <input
                                type="text"
                                placeholder="Search domains..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    marginBottom: '16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                            {!isCustomDomain ? (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                        gap: '12px',
                                        maxHeight: '320px',
                                        overflowY: 'auto',
                                        padding: '16px',
                                        backgroundColor: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px'
                                    }}>
                                        {filteredDomains.map((domain) => (
                                            <button
                                                key={domain}
                                                onClick={() => setSelectedDomain(domain)}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s',
                                                    border: 'none',
                                                    ...(selectedDomain === domain
                                                        ? {
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                                            color: 'white',
                                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                        }
                                                        : {
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e5e7eb',
                                                            color: '#374151'
                                                        })
                                                }}
                                            >
                                                {domain}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsCustomDomain(true);
                                            setSelectedDomain('');
                                        }}
                                        style={{
                                            marginTop: '16px',
                                            padding: '12px 24px',
                                            backgroundColor: '#eff6ff',
                                            border: '2px solid #3b82f6',
                                            color: '#1e40af',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            display: 'block',
                                            width: '100%'
                                        }}
                                    >
                                        Use Custom Domain (Not in List)
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Enter custom domain (e.g., Astronaut, Pastry Chef)"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            marginBottom: '16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                    <button
                                        onClick={() => {
                                            setIsCustomDomain(false);
                                            setCustomDomain('');
                                        }}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#f9fafb',
                                            border: '2px solid #e5e7eb',
                                            color: '#374151',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            display: 'block',
                                            width: '100%'
                                        }}
                                    >
                                        Back to Predefined Domains
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Skill Level */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '16px',
                                display: 'block'
                            }}>
                                Your Current Level
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {['beginner', 'intermediate', 'advanced'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSkillLevel(level)}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: skillLevel === level ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                            backgroundColor: skillLevel === level ? '#eff6ff' : 'white',
                                            color: skillLevel === level ? '#1e40af' : '#374151',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            textTransform: 'capitalize',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Preferences */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '16px',
                                display: 'block'
                            }}>
                                💡 Custom Preferences (Optional)
                            </label>
                            <textarea
                                value={customPreferences}
                                onChange={(e) => setCustomPreferences(e.target.value)}
                                placeholder="E.g., Focus on practical projects, prefer video courses..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        <button
                            onClick={handleGenerateRoadmap}
                            disabled={!(isCustomDomain ? customDomain : selectedDomain)}
                            style={{
                                width: '100%',
                                padding: '16px 24px',
                                background: (isCustomDomain ? customDomain : selectedDomain) ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : '#d1d5db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                boxShadow: (isCustomDomain ? customDomain : selectedDomain) ? '0 10px 15px rgba(0,0,0,0.1)' : 'none',
                                cursor: (isCustomDomain ? customDomain : selectedDomain) ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Zap size={22} />
                            Generate My Roadmap
                        </button>

                        {error && (
                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                backgroundColor: '#fef2f2',
                                border: '2px solid #fecaca',
                                borderRadius: '12px',
                                color: '#991b1b',
                                fontSize: '14px'
                            }}>
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '64px 32px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                        border: '1px solid #f3f4f6',
                        maxWidth: '640px',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            width: '64px',
                            height: '64px',
                            border: '4px solid #e5e7eb',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '24px'
                        }} />
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                            Creating Your Roadmap
                        </h3>
                        <p style={{ color: '#6b7280' }}>
                            Analyzing {isCustomDomain ? customDomain : selectedDomain}...
                        </p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/*  ROADMAP DISPLAY WITH PROGRESS */}
                {roadmap && !loading && (
                    <div>
                        {/* Header */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '32px',
                            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                            border: '1px solid #f3f4f6',
                            marginBottom: '32px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
                                        {roadmap.title}
                                    </h2>
                                    <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                                        {roadmap.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#dbeafe',
                                            color: '#1e40af',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            border: '2px solid #bfdbfe'
                                        }}>
                                            {roadmap.total_estimated_hours} hours total
                                        </span>
                                        {/*  PROGRESS BADGE */}
                                        <span style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#d1fae5',
                                            color: '#065f46',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            border: '2px solid #a7f3d0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Check size={16} />
                                            {totalCompleted}/{roadmap.nodes.reduce((sum, node) => sum + (node.key_topics ? node.key_topics.length : 1), 0)} completed
                                        </span>
                                        <span style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#e9d5ff',
                                            color: '#6b21a8',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            border: '2px solid #d8b4fe',
                                            textTransform: 'capitalize'
                                        }}>
                                            {roadmap.skill_level}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: 'white',
                                        border: '2px solid #e5e7eb',
                                        color: '#374151',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#3b82f6';
                                        e.currentTarget.style.color = '#2563eb';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.color = '#374151';
                                    }}
                                >
                                    <X size={18} />
                                    New Roadmap
                                </button>
                            </div>
                        </div>

                        {/* Roadmap Flow */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '40px',
                            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                            border: '1px solid #f3f4f6',
                            marginBottom: '24px'
                        }}>
                            <h3 style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <TrendingUp size={28} color="#3b82f6" />
                                Your Learning Path
                            </h3>

                            {/* Vertical progress line */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '138px',
                                    top: '0',
                                    bottom: '0',
                                    width: '3px',
                                    background: 'linear-gradient(180deg, #10b981 0%, #3b82f6 30%, #8b5cf6 60%, #ec4899 90%)',
                                    opacity: '0.15',
                                    borderRadius: '2px'
                                }} />

                                {roadmap.nodes.map((node, index) => (
                                    <RoadmapNode key={node.id} node={node} index={index} />
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            border: '1px solid #f3f4f6'
                        }}>
                            <h4 style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Award size={20} color="#3b82f6" />
                                Level Guide
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                {[
                                    { level: 1, label: 'Foundation' },
                                    { level: 2, label: 'Core Skills' },
                                    { level: 3, label: 'Intermediate' },
                                    { level: 4, label: 'Advanced' },
                                    { level: 5, label: 'Expert' }
                                ].map(item => {
                                    const colors = getLevelColor(item.level);
                                    return (
                                        <div key={item.level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                backgroundColor: colors.bg,
                                                border: `2px solid ${colors.border}`
                                            }} />
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 🚀 NEW BOTTOM BUTTONS */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            marginTop: '32px',
                            justifyContent: 'center'
                        }}>
                            <button
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'white',
                                    border: '2px solid #e5e7eb',
                                    color: '#374151',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                    e.currentTarget.style.color = '#2563eb';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.color = '#374151';
                                }}
                            >
                                Save to Profile
                            </button>
                            <button
                                onClick={handleReset}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Zap size={18} />
                                Generate New
                            </button>
                        </div>
                    </div>
                )}

                {/* 🚀 ITEM OPTIONS MODAL (FOR SUBTOPICS) */}
                {selectedItem && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            width: '300px',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '16px'
                            }}>
                                {selectedItem.title}
                            </h3>
                            <button
                                onClick={handleMarkComplete}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    backgroundColor: progress[selectedItem.id] ? '#ef4444' : '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                {progress[selectedItem.id] ? 'Unmark as Completed' : 'Mark as Completed'}
                            </button>
                            <button
                                onClick={handleSearch}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Search
                            </button>
                            <button
                                onClick={() => setSelectedItem(null)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: 'white',
                                    border: '2px solid #e5e7eb',
                                    color: '#374151',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}