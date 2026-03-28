import { useState, useRef, useEffect, useCallback } from 'react'

const SONGS = [
  'Aphex Twin - Actium.mp3',
  'Aphex Twin - Ageispolis.mp3',
  'Aphex Twin - Delphium.mp3',
  'Aphex Twin - Green Calx.mp3',
  'Aphex Twin - Hedphelym.mp3',
  'Aphex Twin - Heliosphan.mp3',
  'Aphex Twin - I.mp3',
  'Aphex Twin - Ptolemy.mp3',
  'Aphex Twin - Pulsewidth.mp3',
  'Aphex Twin - Schottkey 7th Path.mp3',
  'Aphex Twin - Tha.mp3',
  'Aphex Twin - We Are the Music Makers.mp3',
  'Aphex Twin - Xtal.mp3',
  'Beginning.mp3',
  'Cat.mp3',
  'Chris.mp3',
  'Clark.mp3',
  'Danny.mp3',
  'Death.mp3',
  'Dog.mp3',
  'Door.mp3',
  'Droopy Likes Ricochet.mp3',
  'Droopy Likes Your Face.mp3',
  'Dry Hands.mp3',
  'Équinoxe.mp3',
  'Excuse.mp3',
  'Haggstrom.mp3',
  'Key.mp3',
  'Living Mice.mp3',
  'Mice on Venus.mp3',
  'Minecraft.mp3',
  'Moog City.mp3',
  'Oxygène.mp3',
  'Subwoofer Lullaby.mp3',
  'Sweden.mp3',
  'Thirteen.mp3',
  'Wet Hands.mp3',
]

const WINDOW_WIDTH = 360
const WINDOW_HEIGHT = 480

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getArtist(filename) {
  if (filename.includes(' - ')) {
    return filename.split(' - ')[0]
  }
  return 'C418'
}

function getTitle(filename) {
  const name = filename.replace('.mp3', '')
  if (name.includes(' - ')) {
    return name.split(' - ')[1]
  }
  return name
}

export default function RadioWindow({ isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [durations, setDurations] = useState({})
  const [volume, setVolume] = useState(0.7)

  // Dragging state
  const [position, setPosition] = useState({ x: 80, y: 80 })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Audio & visualizer refs — these persist across open/close
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)
  const animFrameRef = useRef(null)
  const listRef = useRef(null)

  // Refs for values the animation loop needs without stale closures
  const isPlayingRef = useRef(false)
  const isOpenRef = useRef(false)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Create the audio element once and keep it forever (never unmount it)
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.volume = 0.7
      audioRef.current = audio
    }
    // Cleanup on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // Keep audio src in sync with currentIndex
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const song = SONGS[currentIndex]
    audio.src = `/songs/${encodeURIComponent(song)}`
    audio.load()
    setCurrentTime(0)
    setDuration(0)
  }, [currentIndex])

  // Attach audio event listeners (once, since audio element is stable)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onEnded = () => {
      setCurrentIndex(prev => (prev + 1) % SONGS.length)
      // Will auto-play via the pendingPlayRef mechanism below
      pendingPlayRef.current = true
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  // Pending play ref — when a song ends, we set this so the canplay handler auto-plays
  const pendingPlayRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onCanPlay = () => {
      // Update duration
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
      // Auto-play if pending
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false
        ensureAudioContext()
        if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume()
        }
        audio.play().then(() => setIsPlaying(true)).catch(() => {})
      }
    }

    audio.addEventListener('canplay', onCanPlay)
    return () => audio.removeEventListener('canplay', onCanPlay)
  }, [])

  // Load durations for all songs in the list
  useEffect(() => {
    if (!isOpen) return
    SONGS.forEach((song, i) => {
      if (durations[i] !== undefined) return
      const a = new Audio(`/songs/${encodeURIComponent(song)}`)
      a.addEventListener('loadedmetadata', () => {
        setDurations(prev => ({ ...prev, [i]: a.duration }))
      })
    })
  }, [isOpen])

  // Setup audio context + analyser
  const ensureAudioContext = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audioCtxRef.current && sourceRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.75
    const source = ctx.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    audioCtxRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source
  }, [])

  // Visualizer draw loop — runs continuously, checks refs for state
  useEffect(() => {
    let running = true

    const draw = () => {
      if (!running) return
      animFrameRef.current = requestAnimationFrame(draw)

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const barCount = 32
      const gap = 2
      const barW = (W - (barCount - 1) * gap) / barCount

      if (!analyserRef.current || !isPlayingRef.current) {
        // Idle: thin flat lines
        for (let i = 0; i < barCount; i++) {
          ctx.fillStyle = '#d1d5db'
          ctx.fillRect(i * (barW + gap), H / 2 - 1, barW, 2)
        }
        return
      }

      const analyser = analyserRef.current
      const bufLen = analyser.frequencyBinCount
      const data = new Uint8Array(bufLen)
      analyser.getByteFrequencyData(data)

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufLen)
        const val = data[dataIndex] / 255
        const h = Math.max(2, val * H * 0.9)
        ctx.fillStyle = '#000'
        ctx.fillRect(i * (barW + gap), H - h, barW, h)
      }
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      running = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Play / pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    ensureAudioContext()
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [isPlaying, ensureAudioContext])

  const playSong = useCallback((index) => {
    const audio = audioRef.current
    if (!audio) return

    // If clicking the same song, just toggle play/pause
    if (index === currentIndex) {
      togglePlay()
      return
    }

    // Pause current, switch song
    audio.pause()
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setCurrentIndex(index)
    // Mark pending play so canplay handler auto-plays
    pendingPlayRef.current = true
  }, [currentIndex, togglePlay])

  const prevSong = () => {
    const idx = (currentIndex - 1 + SONGS.length) % SONGS.length
    playSong(idx)
  }

  const nextSong = () => {
    const idx = (currentIndex + 1) % SONGS.length
    playSong(idx)
  }

  // Seek
  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio) return
    const dur = audio.duration
    if (!dur || isNaN(dur) || !isFinite(dur)) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * dur
    setCurrentTime(pct * dur)
    setDuration(dur)
  }

  // Dragging — clamp to viewport
  const onMouseDown = (e) => {
    if (e.target.closest('.radio-no-drag')) return
    setDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const maxX = window.innerWidth - WINDOW_WIDTH
      const maxY = window.innerHeight - WINDOW_HEIGHT
      const newX = Math.max(0, Math.min(maxX, e.clientX - dragOffset.current.x))
      const newY = Math.max(0, Math.min(maxY, e.clientY - dragOffset.current.y))
      setPosition({ x: newX, y: newY })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  // Clamp on window resize
  useEffect(() => {
    const onResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, window.innerWidth - WINDOW_WIDTH)),
        y: Math.max(0, Math.min(prev.y, window.innerHeight - WINDOW_HEIGHT)),
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Scroll active song into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${currentIndex}"]`)
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentIndex])

  if (!isOpen) return null

  const currentSong = SONGS[currentIndex]

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        width: WINDOW_WIDTH,
        userSelect: dragging ? 'none' : 'auto',
      }}
    >
      {/* Window */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        style={{ height: WINDOW_HEIGHT }}
      >
        {/* Title bar - draggable */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-gray-200 cursor-move select-none bg-gray-50"
          onMouseDown={onMouseDown}
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-800">
            CODYLEJANG: RADIO 1
          </span>
          <button
            className="radio-no-drag text-gray-400 hover:text-gray-700 text-lg leading-none font-light"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Song list */}
        <div
          ref={listRef}
          className="radio-no-drag flex-1 overflow-y-auto"
          style={{ minHeight: 0 }}
        >
          {SONGS.map((song, i) => {
            const active = i === currentIndex
            return (
              <div
                key={song}
                data-index={i}
                onClick={() => playSong(i)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-gray-100 ${
                  active
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {/* Album art placeholder */}
                <div
                  className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold ${
                    active ? 'bg-white text-black' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {active && isPlaying ? '▶' : '♪'}
                </div>
                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${active ? 'text-white' : 'text-gray-900'}`}>
                    {getTitle(song)}
                  </div>
                  <div className={`text-[10px] truncate ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                    {getArtist(song)}
                  </div>
                </div>
                {/* Duration */}
                <span className={`text-[10px] tabular-nums flex-shrink-0 ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                  {durations[i] ? formatTime(durations[i]) : '--:--'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Player controls */}
        <div className="border-t border-gray-200 bg-white px-3 py-3">
          {/* Now playing */}
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold tracking-wide uppercase truncate text-gray-900">
                {getTitle(currentSong)}
              </div>
              <div className="text-[9px] text-gray-400 truncate">
                {getArtist(currentSong)}
              </div>
            </div>
            <span className="text-[9px] text-gray-400 tabular-nums ml-2 flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="radio-no-drag w-full h-1.5 bg-gray-200 rounded-full cursor-pointer mb-3 group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-black rounded-full relative"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={prevSong} className="radio-no-drag text-gray-600 hover:text-black transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              <button onClick={togglePlay} className="radio-no-drag w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition">
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              <button onClick={nextSong} className="radio-no-drag text-gray-600 hover:text-black transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Volume */}
            <div className="radio-no-drag flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                {volume > 0.3 && <path d="M15.54 8.46a5 5 0 010 7.07"/>}
                {volume > 0.6 && <path d="M19.07 4.93a10 10 0 010 14.14"/>}
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-black cursor-pointer"
              />
            </div>
          </div>

          {/* Visualizer */}
          <canvas
            ref={canvasRef}
            width={320}
            height={24}
            className="w-full mt-2"
            style={{ height: 24 }}
          />
        </div>
      </div>
    </div>
  )
}
