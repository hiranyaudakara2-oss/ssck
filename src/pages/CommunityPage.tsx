import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Heart,
  ImagePlus,
  Loader2,
  LogIn,
  MessageSquare,
  Pin,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { CustomLinksSlot } from '../components/CustomLinksSlot';
import { HoverInfoBox } from '../components/HoverInfoBox';
import { MorphingBackdrop, RevealBlock, SafeImage } from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';
import type {
  CommunityCategory,
  CommunityComment,
  CommunityLike,
  CommunityPost,
  PageRoute,
} from '../types';

const CATEGORIES: ('All' | CommunityCategory)[] = [
  'All',
  'Engineering',
  'ICT & AI',
  'Bio-Systems',
  'Agri & Geo',
  'Robotics',
  'General Tech',
];

function AvatarBadge({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-xl border border-white/15 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/20 font-display text-xs font-bold text-blue-200">
      {initials || 'TS'}
    </div>
  );
}

function formatTimestamp(seconds?: number): string {
  if (!seconds) return 'Just now';
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CommunityPostCard({ post }: { post: CommunityPost }) {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    subscribePostInteractions,
    toggleLikePost,
    addCommunityComment,
    deleteCommunityComment,
    updateCommunityPost,
    togglePinCommunityPost,
    deleteCommunityPost,
    uploadImageToImgBB,
  } = useData();

  const [likes, setLikes] = useState<CommunityLike[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeError, setLikeError] = useState('');

  // Inline edit state for post author / admin
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editCategory, setEditCategory] = useState<CommunityCategory>(post.category);
  const [editContent, setEditContent] = useState(post.content);
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || '');
  const [editPendingFile, setEditPendingFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [editUploadPct, setEditUploadPct] = useState<number | null>(null);
  const [editImageError, setEditImageError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const unsub = subscribePostInteractions(post.id, setLikes, setComments);
    return () => unsub();
  }, [post.id, subscribePostInteractions]);

  const userLiked = Boolean(user && likes.some((l) => l.uid === user.uid || l.id === user.uid));
  const isAuthor = Boolean(user && user.uid === post.authorUid);
  const canEdit = Boolean(isAuthor && user?.emailVerified);
  const canModerate = Boolean(isAdmin || isAuthor);

  const handleLike = async () => {
    setLikeError('');
    if (!user || !user.emailVerified) {
      setLikeError('Sign in with Google to like community posts.');
      return;
    }
    try {
      await toggleLikePost(post.id, userLiked);
    } catch (err) {
      setLikeError(err instanceof Error ? err.message : 'Unable to update like.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await addCommunityComment(post.id, commentText.trim());
      setCommentText('');
      setShowComments(true);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await updateCommunityPost(post.id, {
        category: editCategory,
        title: editTitle,
        content: editContent,
        imageUrl: editImageUrl,
      });
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSelectEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEditImageError('');
    if (!file.type.startsWith('image/')) {
      setEditImageError('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditPendingFile(file);
        setEditPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmEditUpload = async () => {
    if (!editPendingFile) return;
    setEditImageError('');
    setEditUploadPct(5);
    try {
      const url = await uploadImageToImgBB(editPendingFile, 'community', setEditUploadPct);
      setEditImageUrl(url);
      setEditPendingFile(null);
      setEditPreviewUrl('');
    } catch (err) {
      setEditImageError(err instanceof Error ? err.message : 'ImgBB image upload failed.');
    } finally {
      setEditUploadPct(null);
    }
  };

  const displayAuthorRole = post.authorRole === 'Student' ? 'Community Member' : post.authorRole;

  return (
    <article className="glass-surface overflow-hidden rounded-2xl transition-colors hover:border-blue-500/35">
      <div className="p-6">
        {/* Post Header: Author Profile + Role + Timestamp + Admin/Author Actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <AvatarBadge name={post.authorName} photoUrl={post.authorPhotoUrl} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-semibold text-white">
                  {post.authorName}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs font-medium text-blue-300">{displayAuthorRole}</span>
                {post.pinned && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  </>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-violet-300">{post.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {formatTimestamp(post.createdAt?.seconds)}
                </span>
              </div>
            </div>
          </div>

          {canModerate && (
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => void togglePinCommunityPost(post.id, !post.pinned, post.title)}
                  title={post.pinned ? 'Unpin Post' : 'Pin Post'}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    post.pinned
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                      : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  title="Edit Post"
                  className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => void deleteCommunityPost(post.id, post.title)}
                title="Delete Post"
                className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Post Content or Inline Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="mt-5 space-y-3 rounded-xl border border-blue-500/30 bg-[#080f23] p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-white/15 bg-[#050914] px-3 py-2 text-sm text-white"
              />
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as CommunityCategory)}
                className="rounded-lg border border-white/15 bg-[#050914] px-3 py-2 text-sm text-white"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              required
              minLength={5}
              maxLength={3000}
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#050914] px-3 py-2 text-sm text-white"
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Optional image URL..."
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                className="min-w-[200px] flex-1 rounded-lg border border-white/15 bg-[#050914] px-3 py-2 text-xs text-white"
              />
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5">
                <Upload className="h-3.5 w-3.5" />
                <span>Select Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectEditImage}
                />
              </label>
            </div>
            {editPendingFile && editPreviewUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-[#050914] p-2.5">
                <img
                  src={editPreviewUrl}
                  alt="Edit preview"
                  className="h-14 w-20 rounded object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate text-xs text-white">{editPendingFile.name}</p>
                  {editUploadPct !== null && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${editUploadPct}%` }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={editUploadPct !== null}
                      onClick={() => void handleConfirmEditUpload()}
                      className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {editUploadPct !== null ? `Uploading ${editUploadPct}%` : 'Upload to ImgBB'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPendingFile(null);
                        setEditPreviewUrl('');
                      }}
                      className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-slate-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
            {editImageError && <p className="text-xs text-amber-300">{editImageError}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={savingEdit || editUploadPct !== null}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <h2 className="font-display text-lg font-bold text-white sm:text-xl">{post.title}</h2>
            <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {post.content}
            </p>
            {post.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <SafeImage
                  src={post.imageUrl}
                  alt={post.title}
                  fallbackLabel={post.title}
                  className="max-h-[420px] w-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Interaction Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => void handleLike()}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                userLiked
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${userLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span className="tabular-nums">{likes.length}</span>
              <span>{likes.length === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span className="tabular-nums">{comments.length}</span>
              <span>{comments.length === 1 ? 'Comment' : 'Comments'}</span>
            </button>
          </div>

          {likeError && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="text-xs font-medium text-blue-300 hover:underline"
            >
              {likeError}
            </button>
          )}
        </div>

        {/* Expandable Comments Thread */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400">
                No comments yet. Start the technical conversation below.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((cmt) => {
                  const canDeleteComment = Boolean(
                    user && (isAdmin || user.uid === cmt.authorUid)
                  );
                  return (
                    <div
                      key={cmt.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#080f23]/80 p-3.5"
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <AvatarBadge name={cmt.authorName} photoUrl={cmt.authorPhotoUrl} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-white">{cmt.authorName}</span>
                            <span className="text-blue-300">
                              {cmt.authorRole === 'Student' ? 'Community Member' : cmt.authorRole}
                            </span>
                            <span className="font-mono tabular-nums text-slate-500">
                              {formatTimestamp(cmt.createdAt?.seconds)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-200">{cmt.body}</p>
                        </div>
                      </div>

                      {canDeleteComment && (
                        <button
                          type="button"
                          onClick={() => void deleteCommunityComment(post.id, cmt.id)}
                          aria-label="Delete comment"
                          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-rose-950/50 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {user && user.emailVerified ? (
              <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  required
                  maxLength={1200}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a constructive technical comment..."
                  className="flex-1 rounded-xl border border-white/15 bg-[#070d1e] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-500/35 bg-blue-600/15 px-4 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-600/25"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign in with Google to comment</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function CommunityPage({
  onNavigate,
}: {
  onNavigate?: (route: PageRoute, subjectId?: string) => void;
}) {
  const {
    user,
    userProfile,
    isAdmin,
    communityPosts,
    registeredMembersCount,
    signInWithGoogle,
    signOutUser,
    createCommunityPost,
    uploadImageToImgBB,
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<'All' | CommunityCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('Engineering');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return communityPosts.filter((p) => {
      const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
      const queryMatch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return catMatch && queryMatch;
    });
  }, [communityPosts, selectedCategory, searchQuery]);

  const handleSelectComposerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg('');
    if (!file.type.startsWith('image/')) {
      setErrorMsg('ImgBB supports image files only (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Please select an image smaller than 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingFile(file);
        setPreviewDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmComposerUpload = async () => {
    if (!pendingFile) return;
    setErrorMsg('');
    setUploadPct(5);
    try {
      const url = await uploadImageToImgBB(pendingFile, 'community', setUploadPct);
      setImageUrl(url);
      setPendingFile(null);
      setPreviewDataUrl('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ImgBB upload failed.');
    } finally {
      setUploadPct(null);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPublishing(true);
    try {
      let finalImageUrl = imageUrl;
      if (pendingFile) {
        setUploadPct(5);
        finalImageUrl = await uploadImageToImgBB(pendingFile, 'community', setUploadPct);
        setPendingFile(null);
        setPreviewDataUrl('');
      }
      await createCommunityPost({
        category,
        title,
        content,
        imageUrl: finalImageUrl,
      });
      setTitle('');
      setContent('');
      setImageUrl('');
      setComposerOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish post.');
    } finally {
      setUploadPct(null);
      setPublishing(false);
    }
  };

  const formattedUserRole = isAdmin
    ? 'Administrator'
    : userProfile?.role === 'teacher'
    ? 'Faculty'
    : 'Community Member';

  return (
    <div className="relative min-h-screen bg-transparent pb-24">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/10 pt-14 pb-12 sm:pt-20 sm:pb-16">
        <MorphingBackdrop variant="section" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-violet-300">
                SSCK TECH Community Member & Faculty Network
              </p>
              <h1
                className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                Technology Community Hub
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Share circuit schematics, software discoveries, robotics logs, lab photos, and technical ideas with registered Community Members and educators across all six disciplines.
              </p>
              <CustomLinksSlot targetSection="community" onNavigate={onNavigate} />
            </div>

            {/* Member Profile / Auth Bar */}
            <div className="glass-surface-elevated flex items-center gap-3 rounded-2xl p-3.5 shrink-0">
              {user && user.emailVerified ? (
                <>
                  <AvatarBadge
                    name={userProfile?.displayName || user.displayName || 'Community Member'}
                    photoUrl={userProfile?.photoURL || user.photoURL || undefined}
                  />
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-xs font-semibold text-white">
                      {userProfile?.displayName || user.displayName}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-blue-300">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{formattedUserRole}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOutUser()}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in with Google to Post</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Feed & Composer Column */}
          <div className="space-y-6 lg:col-span-8">
            {/* Composer Prompt or Form */}
            {user && user.emailVerified ? (
              <div className="glass-surface-elevated rounded-2xl p-5">
                {!composerOpen ? (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AvatarBadge
                        name={userProfile?.displayName || user.displayName || 'Member'}
                        photoUrl={userProfile?.photoURL || user.photoURL || undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setComposerOpen(true)}
                        className="text-left text-sm text-slate-300 hover:text-white"
                      >
                        Share an engineering insight, prototype update, or question...
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      New Post
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-base font-semibold text-white">
                        Publish to SSCK TECH Community
                      </h2>
                      <button
                        type="button"
                        onClick={() => setComposerOpen(false)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {errorMsg && (
                      <div className="rounded-xl border border-rose-500/35 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-200">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={160}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Post headline..."
                        className="sm:col-span-2 rounded-xl border border-white/15 bg-[#070d1e] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
                      />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CommunityCategory)}
                        className="rounded-xl border border-white/15 bg-[#070d1e] px-3.5 py-2.5 text-sm text-white"
                      >
                        {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      required
                      minLength={5}
                      maxLength={3000}
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe your idea, lab experiment, circuit design, or technical question..."
                      className="w-full rounded-xl border border-white/15 bg-[#070d1e] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />

                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Optional image URL..."
                        className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-[#070d1e] px-3.5 py-2 text-xs text-white placeholder:text-slate-500"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/10">
                        <ImagePlus className="h-4 w-4 text-blue-400" />
                        <span>Choose Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSelectComposerImage}
                        />
                      </label>
                    </div>

                    {pendingFile && previewDataUrl && (
                      <div className="rounded-xl border border-blue-500/35 bg-[#070d1e] p-3.5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <img
                            src={previewDataUrl}
                            alt="Pre-upload preview"
                            className="h-24 w-32 shrink-0 rounded-lg border border-white/10 object-cover"
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-white">
                                {pendingFile.name}
                              </p>
                              <span className="font-mono text-[11px] text-slate-400">
                                {(pendingFile.size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                            {uploadPct !== null && (
                              <div className="space-y-1">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                                    style={{ width: `${uploadPct}%` }}
                                  />
                                </div>
                                <p className="font-mono text-[11px] text-blue-300">
                                  Uploading to ImgBB... {uploadPct}%
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={uploadPct !== null}
                                onClick={() => void handleConfirmComposerUpload()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                              >
                                {uploadPct !== null ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5" />
                                )}
                                <span>
                                  {uploadPct !== null
                                    ? `Uploading ${uploadPct}%`
                                    : 'Upload to ImgBB'}
                                </span>
                              </button>
                              <button
                                type="button"
                                disabled={uploadPct !== null}
                                onClick={() => {
                                  setPendingFile(null);
                                  setPreviewDataUrl('');
                                }}
                                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!pendingFile && imageUrl && (
                      <div className="relative overflow-hidden rounded-xl border border-white/10">
                        <SafeImage
                          src={imageUrl}
                          alt="Post preview"
                          className="max-h-48 w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setComposerOpen(false)}
                        className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={publishing || uploadPct !== null}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        {publishing ? 'Publishing...' : 'Publish Post'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="glass-surface flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Join the Conversation
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">
                    Sign in with a verified Google account to publish posts, upload project photos, like discussions, and post comments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            {/* Category & Search Toolbar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search community discussions, authors, or topics..."
                  className="w-full rounded-xl border border-white/15 bg-[#0b1328] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'border-blue-500/60 bg-blue-600 text-white'
                        : 'border-white/10 bg-[#0b1328] text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Feed */}
            {filteredPosts.length === 0 ? (
              <div className="glass-surface rounded-2xl p-10 text-center">
                <p className="font-display text-lg font-semibold text-white">
                  No community posts match your filter yet
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Be the first to share a lab breakthrough, engineering note, or software build with the Technology Section.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredPosts.map((post) => (
                  <RevealBlock key={post.id}>
                    <CommunityPostCard post={post} />
                  </RevealBlock>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Guidelines & Stats */}
          <aside className="space-y-5 lg:col-span-4">
            <div className="glass-surface rounded-2xl p-6">
              <h3 className="font-display text-base font-semibold text-white">
                Community Overview
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <HoverInfoBox
                  title="Registered Community Members"
                  description="Live count automatically updated when members join or accounts are removed."
                  badge="Live Directory"
                  icon={<Users className="h-3.5 w-3.5" />}
                  className="col-span-2"
                >
                  <div className="flex items-center justify-between rounded-xl border border-blue-500/25 bg-[#080f23] p-3.5">
                    <div>
                      <p className="text-xs text-slate-400">Community Members</p>
                      <p className="font-display mt-1 text-2xl font-bold tabular-nums text-white">
                        {registeredMembersCount}
                      </p>
                    </div>
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                </HoverInfoBox>
                <div className="rounded-xl border border-white/10 bg-[#080f23] p-3.5">
                  <p className="text-xs text-slate-400">Total Posts</p>
                  <p className="font-display mt-1 text-2xl font-bold tabular-nums text-white">
                    {communityPosts.length}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#080f23] p-3.5">
                  <p className="text-xs text-slate-400">Pinned Topics</p>
                  <p className="font-display mt-1 text-2xl font-bold tabular-nums text-blue-300">
                    {communityPosts.filter((p) => p.pinned).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-surface rounded-2xl p-6">
              <h3 className="font-display text-base font-semibold text-white">
                Collaboration Guidelines
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-slate-300">
                <li>1. Share verified technical notes, circuit tests, software demos, and academic ideas.</li>
                <li>2. Cite safety standards when posting high-voltage, CNC, or chemical bio-lab workflows.</li>
                <li>3. Keep discussions constructive, respectful, and focused on engineering & science growth.</li>
                <li>4. Administrators moderate posts and pin flagship faculty threads for visibility.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
