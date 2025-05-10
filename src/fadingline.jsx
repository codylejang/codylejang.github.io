import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function FadingLine({ text, lineIndex }) {
  const [fadeOut, setFadeOut] = useState(false)
  const delayBeforeFade = 6000

  useEffect(() => {
    const timeout = setTimeout(() => setFadeOut(true), delayBeforeFade)
    return () => clearTimeout(timeout)
  }, [])

  const words = text.split(' ')

  return (
    <motion.div
      initial={{ y: 200, opacity: 0 }}
      animate={{
        y: lineIndex * 20 + 10,
        opacity: fadeOut ? 0 : 1
      }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className="flex flex-wrap gap-2 absolute left-1/2 -translate-x-1/2"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: fadeOut ? 0 : 1,
            y: fadeOut ? -10 : 0
          }}
          transition={{
            delay: i * 0.5,
            duration: fadeOut ? 0.4 : 1.2,
            ease: 'easeOut'
          }}
          className="text-base"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}
