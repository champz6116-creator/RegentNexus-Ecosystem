import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Edit2, Trash2, User, Mail, MessageSquare, ArrowLeft } from 'lucide-react';
import api from '../../api';

export default function PeerProfileView({ currentAccount }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Google Play-style Trust Score Form States
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [hasReviewedBefore, setHasReviewedBefore] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    const fetchProfileAndReviewData = async () => {
      if (!userId) return;
      try {
        setLoadingProfile(true);
        
        // 1. Fetch reviewed target user details
        const userRes = await api.get(`/users/${userId}`);
        setProfileUser(userRes.data?.user || userRes.data);

        // 2. Load historical score configuration written by this specific user pair
        try {
          const reviewRes = await api.get(`/ratings/my-review-for/${userId}`);
          if (reviewRes.data) {
            setScore(reviewRes.data.score);
            setFeedback(reviewRes.data.feedback || '');
            setHasReviewedBefore(true);
            setIsEditing(false);
          }
        } catch (err) {
          console.log("No previous community evaluation score found for this peer connection.");
        }
      } catch (error) {
        console.error("Failed to load user information context:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileAndReviewData();
  }, [userId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (score === 0) {
      return setStatus({ type: 'error', message: 'Please select a star rating to publish your review.' });
    }

    setLoadingReview(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await api.post('/ratings/rate-peer', {
        targetUser: userId,
        score,
        feedback: feedback.trim()
      });

      // Synchronize overall user ranking scores seamlessly if returned by backend recalculations
      if (data?.updatedUser) {
        setProfileUser(data.updatedUser);
      }

      setStatus({ 
        type: 'success', 
        message: hasReviewedBefore ? 'Your community review has been updated.' : 'Your trust review has been published.' 
      });
      setHasReviewedBefore(true);
      setIsEditing(false);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to sync your review parameters.' 
      });
    } finally {
      setLoadingReview(false);
    }
  };

  const handleRemoveReview = async () => {
    if (!window.confirm("Are you sure you want to delete your trust review? This will immediately reset your contribution to their score calculation.")) return;
    try {
      const { data } = await api.delete(`/ratings/remove-review/${userId}`);
      
      if (data?.updatedUser) {
        setProfileUser(data.updatedUser);
      }

      setScore(0);
      setFeedback('');
      setHasReviewedBefore(false);
      setIsEditing(true);
      setStatus({ type: 'success', message: 'Your trust evaluation history has been dropped.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Could not delete your trust review.' });
    }
  };

  const handleInitiateChat = () => {
  // Use fallback logic to ensure we pass a valid name string
  const fName = profileUser.firstName || 'Campus';
  const lName = profileUser.lastName || 'Member';
  
  // Construct the URL with the name parameter
  navigate(
    `/messages?recipientId=${userId}&sellerName=${encodeURIComponent(fName + ' ' + lName)}`
  );
  };
  
  if (loadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xs font-bold text-slate-400 uppercase tracking-widest">
        Loading student profile...
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-xs font-bold text-rose-500 uppercase tracking-widest">
        Student account profile not found on campus server.
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-4 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 mb-6">
              {profileUser.profilePicture ? (
                <img src={profileUser.profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" />
              ) : (
                <div className="w-20 h-20 bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-xl rounded-full shrink-0">
                  {`${profileUser?.firstName?.[0] || ''}${profileUser?.lastName?.[0] || ''}`.toUpperCase()}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <h2 className="text-xl font-black">{profileUser.firstName} {profileUser.lastName}</h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {profileUser.role || 'Student'} • Regent Community Peer
                  </p>
                </div>
                {currentAccount?._id !== profileUser._id && (
                  <button onClick={handleInitiateChat} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-2xs">
                    <MessageSquare size={14} /> Message Student
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 flex items-center space-x-3">
                <User size={16} className="text-slate-400" />
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Student Number</span>
                  <span className="text-xs font-bold">{profileUser.schoolId || 'Protected / Hidden'}</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 flex items-center space-x-3">
                <Mail size={16} className="text-slate-400" />
                <div className="overflow-hidden">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Academic Mail Address</span>
                  <span className="text-xs font-bold block truncate">{profileUser.schoolMail}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="text-emerald-600 dark:text-emerald-500" size={18} />
                  Campus Trust Score
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Reviews are edit-friendly and updated instantly.
                </p>
              </div>
              {hasReviewedBefore && !isEditing && (
                <div className="flex items-center space-x-1">
                  <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition"><Edit2 size={13} /></button>
                  <button onClick={handleRemoveReview} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"><Trash2 size={13} /></button>
                </div>
              )}
            </div>

            {status.message && (
              <div className={`p-3 rounded-xl text-xs font-bold border ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border-emerald-100' : 'bg-red-50 dark:bg-red-950/20 text-red-700 border-red-100'}`}>{status.message}</div>
            )}

            {currentAccount?._id === profileUser._id ? (
              <p className="text-xs font-bold text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                You cannot evaluate your own profile metrics.
              </p>
            ) : hasReviewedBefore && !isEditing ? (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4">
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} fill={score >= star ? '#059669' : 'transparent'} className={score >= star ? 'text-emerald-600' : 'text-slate-200 dark:text-slate-700'} />
                  ))}
                  <span className="text-[10px] text-slate-400 font-bold pl-1">Your Rating</span>
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  {feedback ? `"${feedback}"` : <span className="text-slate-400 not-italic">No comment left on this user profile.</span>}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Tap to rate trading experience</label>
                  <div className="flex items-center space-x-1.5" onMouseLeave={() => setHoverScore(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setScore(star)} onMouseEnter={() => setHoverScore(star)} className="transition-transform active:scale-95 text-slate-200 dark:text-slate-800">
                        <Star size={24} fill={(hoverScore || score) >= star ? '#059669' : 'transparent'} className={(hoverScore || score) >= star ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Provide feedback regarding response speed, deal clarity, or item safety parameters..." maxLength={250} rows={3} className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 outline-none focus:border-emerald-500 resize-none transition-colors duration-150" />
                </div>

                <button type="submit" disabled={loadingReview} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50">
                  {loadingReview ? 'Publishing Updates...' : hasReviewedBefore ? 'Update Review' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
