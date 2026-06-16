import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Printer,
  Type,
  Tag,
  Image as ImageIcon,
  QrCode,
  Square,
  User,
  Layers,
  LayoutTemplate,
  RotateCcw,
  Upload,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { roleMeta, cn } from '../lib/ui'

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
// An ID-card template is a free-form canvas (card px) of absolutely-positioned
// elements. "field" / "photo" / "qr" elements bind to a real staff member at
// render time; the QR is the person's server-issued, scannable STF-… badge.

type Binding =
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'role'
  | 'staffId'
  | 'facility'
  | 'email'
  | 'phone'

type ElType = 'text' | 'field' | 'photo' | 'qr' | 'logo' | 'rect' | 'image'

interface El {
  id: string
  type: ElType
  x: number
  y: number
  w: number
  h: number
  text?: string // static text (type 'text')
  field?: Binding // bound field (type 'field')
  fontSize?: number
  bold?: boolean
  color?: string
  align?: 'left' | 'center' | 'right'
  uppercase?: boolean
  src?: string // image data URL (type 'logo' / 'image')
  fit?: 'cover' | 'contain' // object-fit for image elements
  bg?: string // fill (type 'rect')
  radius?: number
}

interface Template {
  id: string
  name: string
  w: number
  h: number
  bg: string
  bgImage?: string // full-card background image (data URL), behind everything
  bgFit?: 'cover' | 'contain'
  radius: number
  elements: El[]
  updatedAt: number
}

interface CardData {
  id: string
  firstName: string
  lastName: string
  role: string
  staffId?: string
  qrCode?: string
  photo?: string | null
  email?: string
  phone?: string
  facility?: { name?: string } | null
}

interface StaffRow {
  id: string
  firstName: string
  lastName: string
  role: string
  staffId?: string
}

const SCALE = 1.7 // editor zoom — model px are rendered SCALE× larger

const BINDING_LABEL: Record<Binding, string> = {
  fullName: 'Full name',
  firstName: 'First name',
  lastName: 'Last name',
  role: 'Role',
  staffId: 'Staff ID',
  facility: 'Facility',
  email: 'Email',
  phone: 'Phone',
}

const BINDING_PLACEHOLDER: Record<Binding, string> = {
  fullName: 'FULL NAME',
  firstName: 'First',
  lastName: 'Last',
  role: 'Role',
  staffId: 'STF-XXXXXX',
  facility: 'Facility name',
  email: 'name@org',
  phone: '+000 000 0000',
}

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n))

// Strip a template down to the body the API persists (server owns id/updatedAt).
function templateBody(t: Template) {
  return {
    name: t.name,
    w: t.w,
    h: t.h,
    bg: t.bg,
    bgImage: t.bgImage,
    bgFit: t.bgFit ?? 'cover',
    radius: t.radius,
    elements: t.elements,
  }
}

// A ready-to-use card so the canvas is never blank on first open.
function defaultTemplate(): Template {
  return {
    id: uid(),
    name: 'Standard Badge',
    w: 340,
    h: 214,
    bg: '#ffffff',
    radius: 16,
    updatedAt: Date.now(),
    elements: [
      { id: uid(), type: 'rect', x: 0, y: 0, w: 340, h: 50, bg: '#6366F1', radius: 0 },
      { id: uid(), type: 'logo', x: 14, y: 9, w: 32, h: 32 },
      { id: uid(), type: 'text', x: 54, y: 11, w: 240, h: 18, text: 'SAMPLE TRACKER', fontSize: 15, bold: true, color: '#ffffff', align: 'left' },
      { id: uid(), type: 'text', x: 54, y: 30, w: 240, h: 12, text: 'Staff Identification', fontSize: 9, bold: false, color: '#e0e7ff', align: 'left' },
      { id: uid(), type: 'photo', x: 16, y: 66, w: 78, h: 96 },
      { id: uid(), type: 'field', x: 104, y: 70, w: 220, h: 22, field: 'fullName', fontSize: 18, bold: true, color: '#0f172a', align: 'left' },
      { id: uid(), type: 'field', x: 104, y: 96, w: 140, h: 16, field: 'role', fontSize: 12, bold: false, color: '#475569', align: 'left' },
      { id: uid(), type: 'field', x: 104, y: 120, w: 140, h: 16, field: 'staffId', fontSize: 13, bold: true, color: '#6366F1', align: 'left' },
      { id: uid(), type: 'field', x: 104, y: 142, w: 140, h: 14, field: 'facility', fontSize: 9, bold: false, color: '#64748b', align: 'left' },
      { id: uid(), type: 'qr', x: 252, y: 118, w: 74, h: 74 },
    ],
  }
}

function newElement(type: ElType): El {
  const base = { id: uid(), type, x: 120, y: 90 }
  switch (type) {
    case 'text':
      return { ...base, w: 120, h: 22, text: 'Text', fontSize: 14, color: '#0f172a', align: 'left' }
    case 'field':
      return { ...base, w: 140, h: 22, field: 'fullName', fontSize: 14, bold: true, color: '#0f172a', align: 'left' }
    case 'photo':
      return { ...base, w: 78, h: 96 }
    case 'qr':
      return { ...base, w: 74, h: 74 }
    case 'logo':
      return { ...base, w: 44, h: 44, fit: 'contain' }
    case 'image':
      return { ...base, w: 100, h: 80, fit: 'cover', radius: 8 }
    case 'rect':
      return { ...base, w: 120, h: 44, bg: '#6366F1', radius: 8 }
  }
}

// Built-in starter designs. Each returns a fresh template (new ids) so picking
// one drops a ready-made layout onto the canvas to tweak and save.
const PRESETS: { name: string; make: () => Template }[] = [
  { name: 'Standard Badge', make: defaultTemplate },
  {
    name: 'Midnight',
    make: () => ({
      id: uid(),
      name: 'Midnight',
      w: 340,
      h: 214,
      bg: '#0f172a',
      bgFit: 'cover',
      radius: 16,
      updatedAt: Date.now(),
      elements: [
        { id: uid(), type: 'rect', x: 0, y: 0, w: 8, h: 214, bg: '#22d3ee', radius: 0 },
        { id: uid(), type: 'text', x: 24, y: 18, w: 200, h: 16, text: 'SAMPLE TRACKER', fontSize: 13, bold: true, color: '#22d3ee', align: 'left', uppercase: true },
        { id: uid(), type: 'photo', x: 24, y: 50, w: 84, h: 104 },
        { id: uid(), type: 'field', x: 122, y: 54, w: 200, h: 22, field: 'fullName', fontSize: 19, bold: true, color: '#f8fafc', align: 'left' },
        { id: uid(), type: 'field', x: 122, y: 82, w: 160, h: 16, field: 'role', fontSize: 12, color: '#94a3b8', align: 'left' },
        { id: uid(), type: 'field', x: 122, y: 108, w: 160, h: 16, field: 'staffId', fontSize: 13, bold: true, color: '#22d3ee', align: 'left' },
        { id: uid(), type: 'field', x: 24, y: 168, w: 220, h: 14, field: 'facility', fontSize: 9, color: '#64748b', align: 'left' },
        { id: uid(), type: 'qr', x: 252, y: 132, w: 64, h: 64 },
      ],
    }),
  },
  {
    name: 'Minimal',
    make: () => ({
      id: uid(),
      name: 'Minimal',
      w: 340,
      h: 214,
      bg: '#ffffff',
      bgFit: 'cover',
      radius: 12,
      updatedAt: Date.now(),
      elements: [
        { id: uid(), type: 'photo', x: 20, y: 20, w: 80, h: 100 },
        { id: uid(), type: 'field', x: 116, y: 24, w: 200, h: 22, field: 'fullName', fontSize: 18, bold: true, color: '#111827', align: 'left' },
        { id: uid(), type: 'field', x: 116, y: 50, w: 200, h: 16, field: 'role', fontSize: 11, color: '#6b7280', align: 'left', uppercase: true },
        { id: uid(), type: 'field', x: 116, y: 78, w: 200, h: 16, field: 'staffId', fontSize: 13, bold: true, color: '#111827', align: 'left' },
        { id: uid(), type: 'rect', x: 20, y: 134, w: 300, h: 1, bg: '#e5e7eb', radius: 0 },
        { id: uid(), type: 'field', x: 20, y: 146, w: 200, h: 40, field: 'facility', fontSize: 10, color: '#9ca3af', align: 'left' },
        { id: uid(), type: 'qr', x: 248, y: 142, w: 68, h: 68 },
      ],
    }),
  },
  {
    name: 'Official (band)',
    make: () => ({
      id: uid(),
      name: 'Official',
      w: 340,
      h: 214,
      bg: '#ffffff',
      bgFit: 'cover',
      radius: 14,
      updatedAt: Date.now(),
      elements: [
        { id: uid(), type: 'rect', x: 0, y: 0, w: 340, h: 56, bg: '#15803d', radius: 0 },
        { id: uid(), type: 'logo', x: 16, y: 12, w: 32, h: 32, fit: 'contain' },
        { id: uid(), type: 'text', x: 56, y: 14, w: 260, h: 16, text: 'OFFICIAL STAFF ID', fontSize: 14, bold: true, color: '#ffffff', align: 'left' },
        { id: uid(), type: 'text', x: 56, y: 33, w: 260, h: 12, text: 'Sample Tracking Authority', fontSize: 9, color: '#dcfce7', align: 'left' },
        { id: uid(), type: 'photo', x: 16, y: 72, w: 80, h: 100 },
        { id: uid(), type: 'field', x: 108, y: 74, w: 220, h: 22, field: 'fullName', fontSize: 18, bold: true, color: '#0f172a', align: 'left' },
        { id: uid(), type: 'field', x: 108, y: 100, w: 160, h: 16, field: 'role', fontSize: 12, color: '#15803d', bold: true, align: 'left' },
        { id: uid(), type: 'field', x: 108, y: 124, w: 160, h: 16, field: 'staffId', fontSize: 13, bold: true, color: '#0f172a', align: 'left' },
        { id: uid(), type: 'field', x: 108, y: 148, w: 160, h: 14, field: 'facility', fontSize: 9, color: '#64748b', align: 'left' },
        { id: uid(), type: 'qr', x: 254, y: 110, w: 72, h: 72 },
      ],
    }),
  },
]

function bindValue(field: Binding, data: CardData | null): string {
  if (!data) return BINDING_PLACEHOLDER[field]
  switch (field) {
    case 'fullName':
      return `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || BINDING_PLACEHOLDER[field]
    case 'firstName':
      return data.firstName ?? ''
    case 'lastName':
      return data.lastName ?? ''
    case 'role':
      return roleMeta(data.role).label
    case 'staffId':
      return data.staffId ?? BINDING_PLACEHOLDER[field]
    case 'facility':
      return data.facility?.name ?? '—'
    case 'email':
      return data.email ?? ''
    case 'phone':
      return data.phone ?? ''
  }
}

// A human label for an element in the Layers list.
function layerLabel(el: El): string {
  switch (el.type) {
    case 'field':
      return `Field · ${BINDING_LABEL[el.field ?? 'fullName']}`
    case 'text':
      return `Text · ${el.text || 'empty'}`
    case 'rect':
      return 'Box / band'
    case 'photo':
      return 'Photo'
    case 'qr':
      return 'QR code'
    case 'logo':
      return 'Logo'
    case 'image':
      return 'Image'
  }
}

// Shrink + re-encode an uploaded image so the base64 we store on the user
// stays small (cards only need a passport-sized photo).
function resizeImage(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        const ctx = c.getContext('2d')
        if (!ctx) return reject(new Error('no canvas'))
        ctx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function IdCards() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [template, setTemplate] = useState<Template>(defaultTemplate)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'design' | 'print'>('design')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [staff, setStaff] = useState<StaffRow[]>([])
  const [boundId, setBoundId] = useState('')
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [cardBusy, setCardBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = template.elements.find((e) => e.id === selectedId) ?? null

  // Load the staff list to drive the "preview as" picker.
  useEffect(() => {
    api
      .get('/users')
      .then((r) => setStaff(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [])

  // Load saved templates from the server; open the most recent one (or the
  // built-in default if none exist yet).
  useEffect(() => {
    api
      .get('/card-templates')
      .then((r) => {
        const list: Template[] = Array.isArray(r.data) ? r.data : []
        setTemplates(list)
        if (list[0]) {
          setTemplate(clone(list[0]))
          setDirty(false)
        }
      })
      .catch(() => {})
  }, [])

  // Pull the full card payload (QR + photo) whenever a staff member is bound.
  useEffect(() => {
    if (!boundId) {
      setCardData(null)
      return
    }
    setCardBusy(true)
    setError(null)
    api
      .get(`/users/${boundId}/card`)
      .then((r) => setCardData(r.data))
      .catch((e) => setError(apiError(e, 'Could not load that staff card')))
      .finally(() => setCardBusy(false))
  }, [boundId])

  const update = (fn: (t: Template) => Template) => {
    setTemplate((t) => fn(t))
    setDirty(true)
  }
  const updateEl = (id: string, patch: Partial<El>) =>
    update((t) => ({
      ...t,
      elements: t.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))

  // --- drag / resize ------------------------------------------------------
  const dragRef = useRef<
    | null
    | { id: string; mode: 'move' | 'resize'; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number }
  >(null)

  const onMove = useRef((e: PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.sx) / SCALE
    const dy = (e.clientY - d.sy) / SCALE
    setTemplate((t) => ({
      ...t,
      elements: t.elements.map((el) => {
        if (el.id !== d.id) return el
        if (d.mode === 'move') {
          return {
            ...el,
            x: clamp(Math.round(d.ox + dx), 0, t.w - el.w),
            y: clamp(Math.round(d.oy + dy), 0, t.h - el.h),
          }
        }
        return {
          ...el,
          w: clamp(Math.round(d.ow + dx), 16, t.w - el.x),
          h: clamp(Math.round(d.oh + dy), 12, t.h - el.y),
        }
      }),
    }))
  })
  const onUp = useRef(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setDirty(true)
    window.removeEventListener('pointermove', onMove.current)
    window.removeEventListener('pointerup', onUp.current)
  })

  function startDrag(e: React.PointerEvent, el: El, mode: 'move' | 'resize') {
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(el.id)
    dragRef.current = { id: el.id, mode, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h }
    window.addEventListener('pointermove', onMove.current)
    window.addEventListener('pointerup', onUp.current)
  }

  // --- template ops -------------------------------------------------------
  // A template is "on the server" once it appears in `templates`; otherwise a
  // Save creates it (POST) and adopts the server-assigned id.
  async function save() {
    setSaving(true)
    setError(null)
    try {
      const exists = templates.some((p) => p.id === template.id)
      const res = exists
        ? await api.patch(`/card-templates/${template.id}`, templateBody(template))
        : await api.post('/card-templates', templateBody(template))
      const saved: Template = res.data
      if (saved?.id) {
        setTemplates((prev) =>
          exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev],
        )
        setTemplate(saved)
      }
      setDirty(false)
    } catch (e) {
      setError(apiError(e, 'Could not save the template'))
    } finally {
      setSaving(false)
    }
  }
  function selectTemplate(id: string) {
    const t = templates.find((p) => p.id === id)
    if (!t) return
    setTemplate(clone(t))
    setSelectedId(null)
    setDirty(false)
  }
  function newTemplate() {
    const t = defaultTemplate()
    t.name = 'Untitled card'
    setTemplate(t)
    setSelectedId(null)
    setDirty(true)
  }
  // Load a built-in starter design as a fresh (unsaved) working template.
  function loadPreset(make: () => Template) {
    setTemplate(make())
    setSelectedId(null)
    setDirty(true)
  }
  async function onBgImagePick(file: File) {
    const dataUrl = await resizeImage(file, 1000)
    update((t) => ({ ...t, bgImage: dataUrl }))
  }
  function duplicate() {
    // Fresh client id → the next Save will POST it as a new server template.
    const t = { ...clone(template), id: uid(), name: `${template.name} copy`, updatedAt: Date.now() }
    setTemplate(t)
    setSelectedId(null)
    setDirty(true)
  }
  async function removeTemplate(id: string) {
    const onServer = templates.some((p) => p.id === id)
    setTemplates((prev) => prev.filter((p) => p.id !== id))
    if (template.id === id) {
      const remaining = templates.filter((p) => p.id !== id)
      setTemplate(remaining[0] ? clone(remaining[0]) : defaultTemplate())
      setSelectedId(null)
      setDirty(false)
    }
    if (onServer) {
      try {
        await api.delete(`/card-templates/${id}`)
      } catch (e) {
        setError(apiError(e, 'Could not delete the template'))
      }
    }
  }
  function addElement(type: ElType) {
    const el = newElement(type)
    update((t) => ({ ...t, elements: [...t.elements, el] }))
    setSelectedId(el.id)
  }
  function deleteSelected() {
    if (!selected) return
    update((t) => ({ ...t, elements: t.elements.filter((e) => e.id !== selected.id) }))
    setSelectedId(null)
  }
  // Move an element up/down in paint order (later in the array = drawn on top).
  function moveLayer(id: string, dir: -1 | 1) {
    update((t) => {
      const els = [...t.elements]
      const i = els.findIndex((e) => e.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= els.length) return t
      ;[els[i], els[j]] = [els[j], els[i]]
      return { ...t, elements: els }
    })
  }

  async function onPhotoPick(file: File) {
    if (!cardData) return
    setPhotoBusy(true)
    setError(null)
    try {
      const dataUrl = await resizeImage(file)
      await api.patch(`/users/${cardData.id}`, { photo: dataUrl })
      setCardData((d) => (d ? { ...d, photo: dataUrl } : d))
    } catch (e) {
      setError(apiError(e, 'Could not save the photo'))
    } finally {
      setPhotoBusy(false)
    }
  }

  function print() {
    printCard(template, cardData)
  }

  // -----------------------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">ID Card Designer</h2>
          <p className="text-sm text-slate-400">
            Design a staff badge, bind a real person, print the scannable card.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Design ⇆ Print-staff-cards view toggle */}
          <div className="flex rounded-lg border p-0.5 text-sm dark:border-ink-700">
            <button
              onClick={() => setView('design')}
              className={cn('rounded-md px-3 py-1.5 font-medium', view === 'design' ? 'bg-brand/15 text-brand-600 dark:text-brand-400' : 'text-slate-500')}
            >
              Design
            </button>
            <button
              onClick={() => setView('print')}
              className={cn('rounded-md px-3 py-1.5 font-medium', view === 'print' ? 'bg-brand/15 text-brand-600 dark:text-brand-400' : 'text-slate-500')}
            >
              Print staff cards
            </button>
          </div>
          {view === 'design' && (
            <>
              <select
                className="input max-w-[220px]"
                value={boundId}
                onChange={(e) => setBoundId(e.target.value)}
              >
                <option value="">Preview as… (placeholders)</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} · {roleMeta(s.role).label}
                  </option>
                ))}
              </select>
              <button onClick={print} className="btn-ghost" title="Print this card">
                <Printer size={16} /> Print
              </button>
              <button onClick={save} disabled={saving} className="btn-primary" title="Save template">
                <Save size={16} /> {saving ? 'Saving…' : dirty ? 'Save*' : 'Saved'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="card border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      {view === 'print' && <StaffPrintGrid staff={staff} templates={templates} current={template} />}

      {view === 'design' && (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[250px_1fr_260px]">
        {/* Left — templates, elements, card settings */}
        <div className="space-y-4">
          <Panel title="Templates" icon={<Layers size={15} />}>
            <div className="space-y-1">
              {templates.length === 0 && (
                <p className="px-1 py-2 text-xs text-slate-400">
                  No saved templates yet. Tweak the card and hit Save.
                </p>
              )}
              {templates.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm',
                    t.id === template.id
                      ? 'bg-brand/15 text-brand-600 dark:text-brand-400'
                      : 'hover:bg-slate-100 dark:hover:bg-ink-800',
                  )}
                >
                  <button onClick={() => selectTemplate(t.id)} className="flex-1 truncate text-left">
                    {t.name}
                  </button>
                  <button
                    onClick={() => removeTemplate(t.id)}
                    title="Delete template"
                    className="text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={newTemplate} className="btn-ghost flex-1 text-xs">
                <Plus size={14} /> New
              </button>
              <button onClick={duplicate} className="btn-ghost flex-1 text-xs">
                <Copy size={14} /> Duplicate
              </button>
            </div>
          </Panel>

          <Panel title="Start from a template" icon={<LayoutTemplate size={15} />}>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => loadPreset(p.make)}
                  className="rounded-lg border px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand-600 dark:border-ink-700 dark:text-slate-300 dark:hover:text-brand-400"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Loads a ready-made design onto the canvas — tweak it, then Save.
            </p>
          </Panel>

          <Panel title="Add element" icon={<Plus size={15} />}>
            <div className="grid grid-cols-2 gap-2">
              <AddBtn onClick={() => addElement('field')} icon={<Tag size={14} />} label="Field" />
              <AddBtn onClick={() => addElement('text')} icon={<Type size={14} />} label="Text" />
              <AddBtn onClick={() => addElement('photo')} icon={<User size={14} />} label="Photo" />
              <AddBtn onClick={() => addElement('qr')} icon={<QrCode size={14} />} label="QR" />
              <AddBtn onClick={() => addElement('image')} icon={<ImageIcon size={14} />} label="Image" />
              <AddBtn onClick={() => addElement('logo')} icon={<ImageIcon size={14} />} label="Logo" />
              <AddBtn onClick={() => addElement('rect')} icon={<Square size={14} />} label="Box" />
            </div>
          </Panel>

          <Panel title="Layers" icon={<Layers size={15} />}>
            <p className="mb-2 text-[11px] text-slate-400">
              Click to select any element — even ones hidden behind others (like
              the header band). Top of the list is the front layer.
            </p>
            <div className="space-y-1">
              {[...template.elements].reverse().map((el) => (
                <div
                  key={el.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                    el.id === selectedId
                      ? 'bg-brand/15 text-brand-600 dark:text-brand-400'
                      : 'hover:bg-slate-100 dark:hover:bg-ink-800',
                  )}
                >
                  <button onClick={() => setSelectedId(el.id)} className="flex-1 truncate text-left">
                    {layerLabel(el)}
                  </button>
                  <button
                    onClick={() => moveLayer(el.id, 1)}
                    title="Bring forward"
                    className="text-slate-400 opacity-0 transition hover:text-brand-600 group-hover:opacity-100"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => moveLayer(el.id, -1)}
                    title="Send backward"
                    className="text-slate-400 opacity-0 transition hover:text-brand-600 group-hover:opacity-100"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Card" icon={<Square size={15} />}>
            <Labeled label="Name">
              <input
                className="input"
                value={template.name}
                onChange={(e) => update((t) => ({ ...t, name: e.target.value }))}
              />
            </Labeled>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => update((t) => ({ ...t, w: 340, h: 214 }))}
                className={cn('btn-ghost flex-1 text-xs', template.w >= template.h && 'ring-1 ring-brand')}
              >
                Landscape
              </button>
              <button
                onClick={() => update((t) => ({ ...t, w: 214, h: 340 }))}
                className={cn('btn-ghost flex-1 text-xs', template.h > template.w && 'ring-1 ring-brand')}
              >
                Portrait
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Num label="W" value={template.w} onChange={(v) => update((t) => ({ ...t, w: v }))} />
              <Num label="H" value={template.h} onChange={(v) => update((t) => ({ ...t, h: v }))} />
            </div>
            <Labeled label="Background color">
              <Color value={template.bg} onChange={(v) => update((t) => ({ ...t, bg: v }))} />
            </Labeled>
            <Labeled label="Background image">
              <div className="flex items-center gap-2">
                <label className="btn-ghost flex-1 cursor-pointer justify-center text-xs">
                  <Upload size={14} /> {template.bgImage ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void onBgImagePick(f)
                    }}
                  />
                </label>
                {template.bgImage && (
                  <button
                    onClick={() => update((t) => ({ ...t, bgImage: undefined }))}
                    className="btn-ghost text-xs text-slate-400 hover:text-red-500"
                    title="Remove background image"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {template.bgImage && (
                <div className="mt-2 flex gap-2">
                  {(['cover', 'contain'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => update((t) => ({ ...t, bgFit: f }))}
                      className={cn(
                        'btn-ghost flex-1 text-xs',
                        (template.bgFit ?? 'cover') === f && 'ring-1 ring-brand',
                      )}
                    >
                      {f === 'cover' ? 'Fill' : 'Fit'}
                    </button>
                  ))}
                </div>
              )}
            </Labeled>
            <Num label="Corner radius" value={template.radius} onChange={(v) => update((t) => ({ ...t, radius: v }))} />
          </Panel>
        </div>

        {/* Center — canvas */}
        <div className="card flex min-h-[440px] flex-col items-center justify-center overflow-auto bg-slate-100 dark:bg-ink-950">
          <div
            style={{ width: template.w * SCALE, height: template.h * SCALE }}
            onPointerDown={() => setSelectedId(null)}
          >
            <div
              style={{
                width: template.w,
                height: template.h,
                transform: `scale(${SCALE})`,
                transformOrigin: 'top left',
                background: template.bg,
                borderRadius: template.radius,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,.18)',
              }}
            >
              {template.bgImage && (
                <img
                  src={template.bgImage}
                  alt="background"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: template.bgFit ?? 'cover',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {template.elements.map((el) => (
                <ElementView
                  key={el.id}
                  el={el}
                  data={cardData}
                  selected={el.id === selectedId}
                  onDown={(e) => startDrag(e, el, 'move')}
                  onResize={(e) => startDrag(e, el, 'resize')}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {cardBusy
              ? 'Loading staff card…'
              : cardData
                ? `Previewing ${cardData.firstName} ${cardData.lastName} · ${cardData.staffId ?? ''}`
                : 'Drag to move · drag the corner to resize'}
          </p>
        </div>

        {/* Right — properties */}
        <div className="space-y-4">
          {selected ? (
            <Panel
              title={`Selected: ${selected.type}`}
              icon={<RotateCcw size={15} />}
              action={
                <button onClick={deleteSelected} className="text-slate-400 hover:text-red-500" title="Delete element">
                  <Trash2 size={15} />
                </button>
              }
            >
              <div className="grid grid-cols-2 gap-2">
                <Num label="X" value={selected.x} onChange={(v) => updateEl(selected.id, { x: v })} />
                <Num label="Y" value={selected.y} onChange={(v) => updateEl(selected.id, { y: v })} />
                <Num label="W" value={selected.w} onChange={(v) => updateEl(selected.id, { w: v })} />
                <Num label="H" value={selected.h} onChange={(v) => updateEl(selected.id, { h: v })} />
              </div>

              {selected.type === 'field' && (
                <Labeled label="Bound to">
                  <select
                    className="input"
                    value={selected.field}
                    onChange={(e) => updateEl(selected.id, { field: e.target.value as Binding })}
                  >
                    {(Object.keys(BINDING_LABEL) as Binding[]).map((b) => (
                      <option key={b} value={b}>
                        {BINDING_LABEL[b]}
                      </option>
                    ))}
                  </select>
                </Labeled>
              )}

              {selected.type === 'text' && (
                <Labeled label="Text">
                  <input
                    className="input"
                    value={selected.text ?? ''}
                    onChange={(e) => updateEl(selected.id, { text: e.target.value })}
                  />
                </Labeled>
              )}

              {(selected.type === 'text' || selected.type === 'field') && (
                <>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Num label="Font size" value={selected.fontSize ?? 14} onChange={(v) => updateEl(selected.id, { fontSize: v })} />
                    <Labeled label="Color">
                      <Color value={selected.color ?? '#0f172a'} onChange={(v) => updateEl(selected.id, { color: v })} />
                    </Labeled>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Toggle on={!!selected.bold} onClick={() => updateEl(selected.id, { bold: !selected.bold })}>
                      Bold
                    </Toggle>
                    <Toggle on={!!selected.uppercase} onClick={() => updateEl(selected.id, { uppercase: !selected.uppercase })}>
                      UPPER
                    </Toggle>
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <Toggle key={a} on={selected.align === a} onClick={() => updateEl(selected.id, { align: a })}>
                        {a[0].toUpperCase()}
                      </Toggle>
                    ))}
                  </div>
                </>
              )}

              {selected.type === 'rect' && (
                <>
                  <Labeled label="Fill">
                    <Color value={selected.bg ?? '#6366F1'} onChange={(v) => updateEl(selected.id, { bg: v })} />
                  </Labeled>
                  <Num label="Corner radius" value={selected.radius ?? 0} onChange={(v) => updateEl(selected.id, { radius: v })} />
                </>
              )}

              {(selected.type === 'logo' || selected.type === 'image') && (
                <>
                  <Labeled label={selected.type === 'logo' ? 'Logo image' : 'Image'}>
                    <label className="btn-ghost w-full cursor-pointer justify-center text-xs">
                      <Upload size={14} /> {selected.src ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (f)
                            updateEl(selected.id, {
                              src: await resizeImage(f, selected.type === 'logo' ? 256 : 800),
                            })
                        }}
                      />
                    </label>
                    {selected.src && (
                      <button onClick={() => updateEl(selected.id, { src: undefined })} className="mt-1.5 text-xs text-slate-400 hover:text-red-500">
                        Remove image
                      </button>
                    )}
                  </Labeled>
                  <div className="mt-2 flex gap-2">
                    {(['cover', 'contain'] as const).map((f) => (
                      <Toggle
                        key={f}
                        on={(selected.fit ?? (selected.type === 'logo' ? 'contain' : 'cover')) === f}
                        onClick={() => updateEl(selected.id, { fit: f })}
                      >
                        {f === 'cover' ? 'Fill' : 'Fit'}
                      </Toggle>
                    ))}
                  </div>
                  <Num label="Corner radius" value={selected.radius ?? 0} onChange={(v) => updateEl(selected.id, { radius: v })} />
                </>
              )}

              {selected.type === 'photo' && (
                <p className="mt-2 text-xs text-slate-400">
                  Shows the bound staff member's photo.{' '}
                  {cardData ? (
                    <label className="cursor-pointer font-semibold text-brand-600 dark:text-brand-400">
                      {photoBusy ? 'Uploading…' : 'Upload / replace photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={photoBusy}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) onPhotoPick(f)
                        }}
                      />
                    </label>
                  ) : (
                    'Bind a staff member to set their photo.'
                  )}
                </p>
              )}

              {selected.type === 'qr' && (
                <p className="mt-2 text-xs text-slate-400">
                  Renders the staff member's scannable badge QR (encodes their{' '}
                  <span className="font-mono">STF-…</span> ID).
                </p>
              )}
            </Panel>
          ) : (
            <Panel title="Properties" icon={<RotateCcw size={15} />}>
              <p className="text-xs text-slate-400">
                Select an element on the card to edit it. Add fields, a photo box,
                the QR, a logo or boxes from the left.
              </p>
            </Panel>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Canvas element
// ---------------------------------------------------------------------------
function ElementView({
  el,
  data,
  selected,
  onDown,
  onResize,
}: {
  el: El
  data: CardData | null
  selected: boolean
  onDown: (e: React.PointerEvent) => void
  onResize: (e: React.PointerEvent) => void
}) {
  const box: CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    cursor: 'move',
    outline: selected ? '1.5px solid #6366F1' : '1px dashed rgba(99,102,241,.35)',
    outlineOffset: 0,
  }

  return (
    <div style={box} onPointerDown={onDown}>
      <ElementBody el={el} data={data} />
      {selected && (
        <span
          onPointerDown={onResize}
          style={{
            position: 'absolute',
            right: -4,
            bottom: -4,
            width: 10,
            height: 10,
            background: '#6366F1',
            borderRadius: 2,
            cursor: 'nwse-resize',
          }}
        />
      )}
    </div>
  )
}

function ElementBody({ el, data }: { el: El; data: CardData | null }) {
  if (el.type === 'rect') {
    return <div style={{ width: '100%', height: '100%', background: el.bg, borderRadius: el.radius }} />
  }
  if (el.type === 'logo' || el.type === 'image') {
    return el.src ? (
      <img
        src={el.src}
        alt={el.type}
        style={{
          width: '100%',
          height: '100%',
          objectFit: el.fit ?? (el.type === 'logo' ? 'contain' : 'cover'),
          borderRadius: el.radius ?? 0,
        }}
      />
    ) : (
      <Placeholder label={el.type === 'logo' ? 'LOGO' : 'IMAGE'} icon={<ImageIcon size={Math.min(el.w, el.h) * 0.35} />} />
    )
  }
  if (el.type === 'photo') {
    return data?.photo ? (
      <img src={data.photo} alt="staff" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
    ) : (
      <Placeholder label="PHOTO" icon={<User size={Math.min(el.w, el.h) * 0.4} />} />
    )
  }
  if (el.type === 'qr') {
    return data?.qrCode ? (
      <img
        src={data.qrCode}
        alt="qr"
        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
      />
    ) : (
      <Placeholder label="QR" icon={<QrCode size={Math.min(el.w, el.h) * 0.4} />} />
    )
  }
  // text or field
  const value = el.type === 'field' ? bindValue(el.field ?? 'fullName', data) : el.text ?? ''
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontSize: el.fontSize,
          fontWeight: el.bold ? 700 : 400,
          color: el.color,
          textTransform: el.uppercase ? 'uppercase' : 'none',
          textAlign: el.align,
          lineHeight: 1.12,
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily:
            el.type === 'field' && el.field === 'staffId'
              ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
              : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Placeholder({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: 'rgba(99,102,241,.06)',
        border: '1px dashed rgba(99,102,241,.4)',
        borderRadius: 6,
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.4,
      }}
    >
      {icon}
      {label}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Print — renders the card large + crisp on its own sheet
// ---------------------------------------------------------------------------
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

// The inner HTML of one card (background image + positioned elements) at a given
// px scale. Shared by single-card and batch-sheet printing.
function cardInnerHTML(template: Template, data: CardData | null, scale: number): string {
  const bg = template.bgImage
    ? `<img src="${template.bgImage}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${template.bgFit ?? 'cover'}"/>`
    : ''
  const body = template.elements
    .map((el) => {
      const pos = `position:absolute;left:${el.x * scale}px;top:${el.y * scale}px;width:${el.w * scale}px;height:${el.h * scale}px;`
      if (el.type === 'rect')
        return `<div style="${pos}background:${el.bg};border-radius:${(el.radius ?? 0) * scale}px"></div>`
      if (el.type === 'logo' || el.type === 'image') {
        const fit = el.fit ?? (el.type === 'logo' ? 'contain' : 'cover')
        const rad = el.radius ? `border-radius:${el.radius * scale}px;` : ''
        return el.src
          ? `<img src="${el.src}" style="${pos}object-fit:${fit};${rad}"/>`
          : `<div style="${pos}"></div>`
      }
      if (el.type === 'photo')
        return data?.photo
          ? `<img src="${data.photo}" style="${pos}object-fit:cover;border-radius:${6 * scale}px"/>`
          : `<div style="${pos}border:1px dashed #c7d2fe;border-radius:${6 * scale}px"></div>`
      if (el.type === 'qr')
        return data?.qrCode
          ? `<img src="${data.qrCode}" style="${pos}object-fit:contain;image-rendering:pixelated"/>`
          : `<div style="${pos}border:1px dashed #c7d2fe"></div>`
      const value = el.type === 'field' ? bindValue(el.field ?? 'fullName', data) : el.text ?? ''
      const mono =
        el.type === 'field' && el.field === 'staffId'
          ? 'font-family:ui-monospace,Menlo,monospace;'
          : ''
      const align = el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'
      return `<div style="${pos}display:flex;align-items:center;justify-content:${align};overflow:hidden">
        <span style="${mono}font-size:${(el.fontSize ?? 14) * scale}px;font-weight:${el.bold ? 700 : 400};color:${el.color};text-align:${el.align ?? 'left'};text-transform:${el.uppercase ? 'uppercase' : 'none'};line-height:1.12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%">${esc(value)}</span>
      </div>`
    })
    .join('')
  return bg + body
}

// The little script that waits for all images to decode, then prints.
const PRINT_WAIT_SCRIPT = `<script>
  (function () {
    var imgs = Array.prototype.slice.call(document.images);
    var left = imgs.length;
    function go() { window.focus(); window.print(); }
    if (left === 0) return go();
    imgs.forEach(function (img) {
      if (img.complete) { if (--left === 0) go(); }
      else img.addEventListener('load', function () { if (--left === 0) go(); });
    });
    setTimeout(go, 2500);
  })();
</script>`

function printCard(template: Template, data: CardData | null) {
  printCards(template, [data], template.name)
}

// Print one OR many cards: each card is laid out on the sheet, wrapping into a
// grid so a whole roster prints across pages. `scale` keeps them crisp.
function printCards(template: Template, cards: (CardData | null)[], title: string) {
  if (cards.length === 0) return
  const scale = 2.6
  const w = template.w * scale
  const h = template.h * scale
  const radius = template.radius * scale

  const cardsHtml = cards
    .map(
      (data) =>
        `<div class="card">${cardInnerHTML(template, data, scale)}</div>`,
    )
    .join('')

  const win = window.open('', '_blank', 'width=1000,height=760')
  if (!win) return
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <style>
    @page { margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
    .sheet { display: flex; flex-wrap: wrap; gap: 12px; }
    .card { position: relative; width: ${w}px; height: ${h}px; background: ${template.bg};
      border-radius: ${radius}px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,.12);
      break-inside: avoid; }
  </style></head><body>
    <div class="sheet">${cardsHtml}</div>
    ${PRINT_WAIT_SCRIPT}
  </body></html>`)
  win.document.close()
}

// ---------------------------------------------------------------------------
// Static (read-only) card render — used by the staff print grid
// ---------------------------------------------------------------------------
function CardPreview({
  template,
  data,
  width,
}: {
  template: Template
  data: CardData | null
  width: number
}) {
  const scale = width / template.w
  return (
    <div style={{ width, height: template.h * scale }}>
      <div
        style={{
          width: template.w,
          height: template.h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: template.bg,
          borderRadius: template.radius,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(0,0,0,.12)',
        }}
      >
        {template.bgImage && (
          <img
            src={template.bgImage}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: template.bgFit ?? 'cover' }}
          />
        )}
        {template.elements.map((el) => (
          <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
            <ElementBody el={el} data={data} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Staff print grid — every staff member rendered on a chosen template, with
// per-card and batch printing.
// ---------------------------------------------------------------------------
function StaffPrintGrid({
  staff,
  templates,
  current,
}: {
  staff: StaffRow[]
  templates: Template[]
  current: Template
}) {
  const options = templates.length ? templates : [current]
  const [templateId, setTemplateId] = useState(options[0]?.id ?? current.id)
  const chosen = options.find((t) => t.id === templateId) ?? options[0] ?? current

  const [cards, setCards] = useState<Record<string, CardData>>({})
  const [loaded, setLoaded] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [printing, setPrinting] = useState(false)

  // Eagerly fetch each staff member's card (QR + photo), capped concurrency so a
  // large roster doesn't fire hundreds of requests at once.
  useEffect(() => {
    let cancelled = false
    setCards({})
    setLoaded(0)
    const ids = staff.map((s) => s.id)
    let i = 0
    async function worker() {
      while (i < ids.length && !cancelled) {
        const id = ids[i++]
        try {
          const r = await api.get(`/users/${id}/card`)
          if (!cancelled) {
            setCards((prev) => ({ ...prev, [id]: r.data }))
            setLoaded((n) => n + 1)
          }
        } catch {
          if (!cancelled) setLoaded((n) => n + 1)
        }
      }
    }
    void Promise.all(Array.from({ length: 6 }, worker))
    return () => {
      cancelled = true
    }
  }, [staff])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const allSelected = staff.length > 0 && selected.size === staff.length
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(staff.map((s) => s.id)))
  }

  // Ensure each id's card is loaded (fetch any stragglers), then print the batch.
  async function printIds(ids: string[]) {
    if (ids.length === 0) return
    setPrinting(true)
    const list: (CardData | null)[] = []
    for (const id of ids) {
      let c: CardData | null = cards[id] ?? null
      if (!c) {
        try {
          c = (await api.get(`/users/${id}/card`)).data as CardData
        } catch {
          c = null
        }
      }
      list.push(c)
    }
    printCards(chosen, list, `${chosen.name} — ${ids.length} card${ids.length > 1 ? 's' : ''}`)
    setPrinting(false)
  }

  if (options.length === 0 || (templates.length === 0 && current.elements.length === 0)) {
    return (
      <div className="card grid place-items-center py-16 text-center text-sm text-slate-400">
        Design and save a template first, then come back here to print staff cards.
      </div>
    )
  }

  const toPrint = selected.size ? [...selected] : staff.map((s) => s.id)

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Template</span>
          <select className="input max-w-[220px]" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {options.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {templates.length === 0 && (
          <span className="text-xs text-amber-500">Unsaved draft — Save it in Design to keep it.</span>
        )}
        <button onClick={toggleAll} className="btn-ghost text-sm">
          {allSelected ? 'Clear selection' : 'Select all'}
        </button>
        <span className="text-xs text-slate-400">
          {loaded < staff.length ? `Loading cards ${loaded}/${staff.length}…` : `${staff.length} staff`}
          {selected.size ? ` · ${selected.size} selected` : ''}
        </span>
        <button
          onClick={() => void printIds(toPrint)}
          disabled={printing || staff.length === 0}
          className="btn-primary ml-auto"
        >
          {printing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
          {selected.size ? `Print selected (${selected.size})` : `Print all (${staff.length})`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {staff.map((s) => {
          const isSel = selected.has(s.id)
          return (
            <div
              key={s.id}
              className={cn(
                'card !p-3 space-y-2 transition',
                isSel && 'ring-2 ring-brand',
              )}
            >
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isSel} onChange={() => toggle(s.id)} className="accent-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="block truncate text-xs text-slate-400">{roleMeta(s.role).label}</span>
                </span>
              </label>
              <div className="overflow-hidden rounded-lg" onClick={() => toggle(s.id)} role="button">
                <CardPreview template={chosen} data={cards[s.id] ?? null} width={210} />
              </div>
              <button onClick={() => void printIds([s.id])} disabled={printing} className="btn-ghost w-full text-xs">
                <Printer size={14} /> Print
              </button>
            </div>
          )
        })}
        {staff.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">No staff to show.</div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small UI bits
// ---------------------------------------------------------------------------
function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="card !p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {icon}
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function AddBtn({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:border-brand hover:text-brand-600 dark:border-ink-700 dark:text-slate-300 dark:hover:text-brand-400"
    >
      {icon}
      {label}
    </button>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-2 block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type="number"
        className="input"
        value={value}
        onChange={(e) => onChange(Math.round(Number(e.target.value) || 0))}
      />
    </label>
  )
}

function Color({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent dark:border-ink-700"
      />
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs font-semibold transition',
        on
          ? 'border-brand bg-brand/15 text-brand-600 dark:text-brand-400'
          : 'border-transparent bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-slate-300',
      )}
    >
      {children}
    </button>
  )
}
