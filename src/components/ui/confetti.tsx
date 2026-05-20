"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

type Particle = {
  id: number
  x: number
  y: number
  color: string
  size: number
  delay: number
  duration: number
  rotate: number
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) {
      setParticles([])
      return
    }

    const newParticles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: -10 - Math.random() * 20, // initial y above viewport
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 6, // 6px to 14px
      delay: Math.random() * 0.5,
      duration: Math.random() * 2.5 + 1.5,
      rotate: Math.random() * 360,
    }))

    setParticles(newParticles)
  }, [active])

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: `${p.y}vh`,
            opacity: 1,
            rotate: p.rotate,
          }}
          animate={{
            y: "110vh",
            rotate: p.rotate + 360 + Math.random() * 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 2 === 0 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  )
}
