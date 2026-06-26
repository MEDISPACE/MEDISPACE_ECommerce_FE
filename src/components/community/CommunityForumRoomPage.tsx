import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ImagePlus, Loader2, PenLine, Search, ShieldCheck, Users, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { PaginationComponent } from '~/components/shared/PaginationComponent'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import { useAuth } from '~/contexts/AuthContext'
import communityService from '~/services/communityService'
import type { CommunityRoom, CommunityThread, CommunityThreadPrefix } from '~/types/community'
import { UserStatus } from '~/types/user'
import { formatRelativeTime, getRoomDescription, getRoomGuidelines, getRoomTopic } from './communityUi'
import { THREAD_PREFIX_OPTIONS, ThreadPrefixBadge, ThreadStateBadges, authorName, formatCount } from './forumUi'

type ThreadSort = 'latest' | 'newest' | 'hot' | 'unanswered'
const THREADS_PER_PAGE = 30

function ThreadListItem({ thread, roomId }: { thread: CommunityThread; roomId: string }) {
  return (
    <div className='grid gap-3 border-b border-slate-100 bg-white px-3 py-3 transition hover:bg-[#F8FBFF] md:grid-cols-[minmax(0,1fr)_74px_74px_190px] md:items-center'>
      <div className='min-w-0'>
        <div className='flex min-w-0 gap-2'>
          <div className='mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-[#EEF6FF] text-xs font-bold text-[#0A2463] sm:flex'>#</div>
          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex flex-wrap items-center gap-1.5'>
              <ThreadPrefixBadge prefix={thread.prefix} />
              <ThreadStateBadges thread={thread} />
            </div>
            <Link to={`/community/${roomId}/t/${thread._id}`} className='line-clamp-2 text-[15px] font-semibold text-[#0A2463] hover:underline'>{thread.title}</Link>
            <p className='mt-0.5 line-clamp-1 text-xs text-slate-600'>{thread.content}</p>
            <p className='mt-1 text-[11px] text-slate-500'>bởi {authorName(thread.author, thread.isAnonymous)}, {formatRelativeTime(thread.createdAt)}</p>
          </div>
        </div>
      </div>
      <div className='hidden text-center text-xs text-slate-600 md:block'><b className='block text-sm text-slate-950'>{formatCount(thread.replyCount)}</b>trả lời</div>
      <div className='hidden text-center text-xs text-slate-600 md:block'><b className='block text-sm text-slate-950'>{formatCount(thread.viewCount)}</b>lượt xem</div>
      <div className='rounded-lg border border-slate-100 bg-[#F8FBFF] px-2 py-1.5 text-xs text-slate-600 md:border-0 md:bg-transparent md:p-0'>
        <p className='line-clamp-1 font-medium text-slate-950'>{formatRelativeTime(thread.lastReplyAt || thread.createdAt)}</p>
        <p className='mt-0.5 text-[11px]'>bởi {authorName(thread.author, thread.isAnonymous)}</p>
      </div>
    </div>
  )
}

export function CommunityForumRoomPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const roomId = params.roomId as string
  const { isAuthenticated, user } = useAuth()
  const createImageInputRef = useRef<HTMLInputElement | null>(null)
  const didMountFiltersRef = useRef(false)
  const [search, setSearch] = useState('')
  const [prefix, setPrefix] = useState<CommunityThreadPrefix | 'all'>('all')
  const [sort, setSort] = useState<ThreadSort>('latest')
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [newPrefix, setNewPrefix] = useState<CommunityThreadPrefix>('question')
  const [tags, setTags] = useState('')
  const [threadImageFile, setThreadImageFile] = useState<File | null>(null)
  const [threadImagePreview, setThreadImagePreview] = useState('')
  const [uploadingThreadImage, setUploadingThreadImage] = useState(false)
  const canUseMemberRooms = isAuthenticated && user?.status === UserStatus.Verified
  const draftKey = roomId ? `community-thread-draft:${roomId}` : ''
  const page = Math.max(1, Number(searchParams.get('page') || 1))

  const roomsQuery = useQuery({
    queryKey: ['community', 'forum-rooms', canUseMemberRooms],
    queryFn: () => (canUseMemberRooms ? communityService.listMyRooms({ sort: 'featured' }) : communityService.listRooms({ sort: 'featured' })),
    staleTime: 30_000,
  })

  const room = useMemo(() => roomsQuery.data?.find((item) => item._id === roomId) as CommunityRoom | undefined, [roomsQuery.data, roomId])
  const isActiveMember = room?.viewerMembership?.status === 'active'

  const threadsQuery = useQuery({
    queryKey: ['community', 'threads', roomId, search, prefix, sort, page],
    queryFn: () => communityService.listThreads({ roomId, page, limit: THREADS_PER_PAGE, q: search, prefix, sort }),
    enabled: Boolean(roomId),
    staleTime: 20_000,
  })

  const joinMutation = useMutation({
    mutationFn: () => {
      if (!room) throw new Error('Missing room')
      return room.visibility === 'private' && room.viewerMembership?.status !== 'invited' ? communityService.requestJoin(room._id) : communityService.joinRoom(room._id)
    },
    onSuccess: () => {
      toast.success(room?.visibility === 'private' ? 'Đã gửi yêu cầu tham gia' : 'Đã tham gia chuyên mục')
      queryClient.invalidateQueries({ queryKey: ['community', 'forum-rooms'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể tham gia chuyên mục'),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined
      if (threadImageFile) {
        setUploadingThreadImage(true)
        try {
          const { uploadImage } = await import('~/services/mediaService')
          imageUrl = await uploadImage(threadImageFile)
        } finally {
          setUploadingThreadImage(false)
        }
      }

      return communityService.createThread({
        roomId,
        title: title.trim(),
        content: content.trim(),
        prefix: newPrefix,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        imageUrl,
      })
    },
    onSuccess: (result) => {
      toast.success('Đã tạo thread')
      setCreateOpen(false)
      setTitle('')
      setContent('')
      setTags('')
      setThreadImageFile(null)
      setThreadImagePreview('')
      if (draftKey) window.localStorage.removeItem(draftKey)
      queryClient.invalidateQueries({ queryKey: ['community', 'threads', roomId] })
      navigate(`/community/${roomId}/t/${result.thread._id}`)
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể tạo thread'),
  })

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tạo thread')
      navigate('/login', { state: { from: { pathname: `/community/${roomId}` } } })
      return
    }
    if (!isActiveMember) {
      toast.error('Bạn cần tham gia chuyên mục trước')
      return
    }
    setCreateOpen(true)
  }

  const handleSubmitThread = () => {
    if (title.trim().length < 8 || content.trim().length < 10) {
      toast.error('Tiêu đề tối thiểu 8 ký tự, nội dung tối thiểu 10 ký tự')
      return
    }
    createMutation.mutate()
  }

  const updatePage = (nextPage: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextPage <= 1) next.delete('page')
      else next.set('page', String(nextPage))
      return next
    })
  }

  const handleThreadImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB')
      return
    }

    setThreadImageFile(file)
    setThreadImagePreview(URL.createObjectURL(file))
    toast.success('Đã chọn ảnh. Ảnh sẽ được tải lên khi đăng thread.')
  }

  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return
    const rawDraft = window.localStorage.getItem(draftKey)
    if (!rawDraft) return

    try {
      const draft = JSON.parse(rawDraft) as { title?: string; content?: string; prefix?: CommunityThreadPrefix; tags?: string }
      setTitle(draft.title || '')
      setContent(draft.content || '')
      setNewPrefix(draft.prefix || 'question')
      setTags(draft.tags || '')
    } catch {
      window.localStorage.removeItem(draftKey)
    }
  }, [draftKey])

  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return
    const hasDraft = title.trim() || content.trim() || tags.trim()
    if (!hasDraft) {
      window.localStorage.removeItem(draftKey)
      return
    }

    window.localStorage.setItem(draftKey, JSON.stringify({ title, content, prefix: newPrefix, tags }))
  }, [content, draftKey, newPrefix, tags, title])

  useEffect(() => {
    if (!threadImagePreview) return
    return () => URL.revokeObjectURL(threadImagePreview)
  }, [threadImagePreview])

  useEffect(() => {
    if (!didMountFiltersRef.current) {
      didMountFiltersRef.current = true
      return
    }
    updatePage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, search, sort])

  const totalThreadPages = Math.max(1, Math.ceil((threadsQuery.data?.total || 0) / THREADS_PER_PAGE))

  return (
    <main className='min-h-screen bg-[#F7FAFC] text-slate-900'>
      <div className='mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-4'>
        <UniversalBreadcrumb items={[{ label: 'Cộng đồng', href: '/community' }, { label: room?.name || 'Chuyên mục' }]} />

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className='sm:max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Tạo thread mới</DialogTitle>
              <DialogDescription>Đặt tiêu đề rõ để người khác dễ tìm, quote và trả lời đúng trọng tâm.</DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='rounded-lg border border-blue-100 bg-[#F8FBFF] px-3 py-2 text-xs leading-5 text-slate-600'>
                Nội dung trong cộng đồng chỉ để chia sẻ kinh nghiệm và trao đổi thông tin. Không đăng đơn thuốc cá nhân, không thay thế tư vấn từ bác sĩ hoặc dược sĩ.
              </div>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder='Tiêu đề thread' />
              <div className='grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]'>
                <Select value={newPrefix} onValueChange={(value) => setNewPrefix(value as CommunityThreadPrefix)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{THREAD_PREFIX_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder='Tags, cách nhau bằng dấu phẩy' />
              </div>
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={8} placeholder='Nội dung thread' />
              {threadImagePreview && (
                <div className='relative mx-1 w-fit'>
                  <img src={threadImagePreview} alt='Ảnh đính kèm thread' className='h-24 w-24 rounded-lg border border-blue-100 object-cover shadow-sm' />
                  <button
                    type='button'
                    className='absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm ring-2 ring-white hover:bg-rose-700'
                    onClick={() => {
                      setThreadImageFile(null)
                      setThreadImagePreview('')
                    }}
                    aria-label='Xóa ảnh đính kèm'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              )}
              <div className='flex flex-wrap items-center gap-2'>
                <input ref={createImageInputRef} type='file' accept='image/*' className='hidden' onChange={handleThreadImageSelect} />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='rounded-lg border-blue-100 text-[#0A2463] hover:bg-blue-50'
                  onClick={() => createImageInputRef.current?.click()}
                  disabled={uploadingThreadImage || createMutation.isPending}
                >
                  {uploadingThreadImage ? <Loader2 className='h-4 w-4 animate-spin' /> : <ImagePlus className='h-4 w-4' />}
                  {uploadingThreadImage ? 'Đang tải ảnh' : threadImagePreview ? 'Đổi ảnh' : 'Thêm ảnh'}
                </Button>
                <span className='text-xs text-slate-500'>JPG, PNG, WebP tối đa 5MB. Nháp được tự lưu trên máy này.</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>Hủy</Button>
              <Button onClick={handleSubmitThread} disabled={createMutation.isPending || uploadingThreadImage} className='bg-[#0A2463] text-white hover:bg-[#12357D]'>
                {createMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <PenLine className='h-4 w-4' />}
                Đăng thread
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <section className='overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
          <div className='border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2 text-[13px] font-semibold text-[#0A2463]'>{room?.name || 'Chuyên mục'}</div>
          <div className='flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0'>
              <Button variant='ghost' className='mb-2 h-auto px-0 py-0 text-[#0A2463] hover:bg-transparent hover:underline' onClick={() => navigate('/community')}><ArrowLeft className='h-4 w-4' />Cộng đồng</Button>
              <h1 className='text-2xl font-bold text-[#0A2463]'>{room?.name || 'Chuyên mục'}</h1>
              <p className='mt-1 max-w-3xl text-sm leading-6 text-slate-600'>{room ? getRoomDescription(room) : 'Danh sách thread trong chuyên mục cộng đồng.'}</p>
              <div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500'>
                <span>{room ? getRoomTopic(room) : 'Sức khỏe'}</span>
                <span className='inline-flex items-center gap-1'><Users className='h-4 w-4' />{room?.memberCount || 0} thành viên</span>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              {!isActiveMember && room && (
                <Button variant='outline' onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                  {joinMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                  {room.visibility === 'private' ? 'Gửi yêu cầu' : 'Tham gia'}
                </Button>
              )}
              <Button onClick={handleOpenCreate} className='rounded-lg bg-[#0A2463] text-white hover:bg-[#071A49]'><PenLine className='h-4 w-4' />Tạo thread</Button>
            </div>
          </div>
        </section>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]'>
          <section className='space-y-3'>
            <div className='rounded-lg border border-[#DDE7F3] bg-white p-3 shadow-sm'>
              <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                  <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm thread trong chuyên mục' />
                </div>
                <Select value={prefix} onValueChange={(value) => setPrefix(value as CommunityThreadPrefix | 'all')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả prefix</SelectItem>
                    {THREAD_PREFIX_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(value) => setSort(value as ThreadSort)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='latest'>Mới hoạt động</SelectItem>
                    <SelectItem value='newest'>Mới tạo</SelectItem>
                    <SelectItem value='hot'>Sôi nổi</SelectItem>
                    <SelectItem value='unanswered'>Chưa trả lời</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {threadsQuery.isLoading ? (
              <div className='space-y-2'>{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className='h-20 rounded-lg' />)}</div>
            ) : threadsQuery.data?.items?.length ? (
              <div className='space-y-3'>
                <div className='overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
                  <div className='hidden grid-cols-[minmax(0,1fr)_74px_74px_190px] border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#0A2463] md:grid'>
                    <span>Chủ đề</span><span className='text-center'>Trả lời</span><span className='text-center'>Lượt xem</span><span>Bài mới</span>
                  </div>
                  {threadsQuery.data.items.map((thread) => <ThreadListItem key={thread._id} thread={thread} roomId={roomId} />)}
                </div>
                {totalThreadPages > 1 && <PaginationComponent currentPage={page} totalPages={totalThreadPages} onPageChange={updatePage} className='rounded-lg border border-[#DDE7F3] bg-white py-4 shadow-sm' />}
              </div>
            ) : (
              <div className='rounded-lg border border-[#DDE7F3] bg-white p-8 text-center shadow-sm'>
                <h3 className='text-base font-semibold text-slate-950'>Chưa có thread phù hợp</h3>
                <p className='mt-1 text-sm text-slate-600'>Bạn có thể tạo thread đầu tiên cho chuyên mục này.</p>
              </div>
            )}
          </section>

          <aside className='space-y-4'>
            <div className='overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
              <h2 className='flex items-center gap-2 border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2 text-sm font-semibold text-[#0A2463]'><ShieldCheck className='h-4 w-4 text-[#27623a]' />Nội quy chuyên mục</h2>
              <ul className='space-y-2 p-3 text-sm text-slate-600'>{getRoomGuidelines(room).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CommunityForumRoomPage
