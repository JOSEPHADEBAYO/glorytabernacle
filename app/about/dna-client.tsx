'use client'

import { useEffect, useRef, useState } from 'react'

const DNA_VALUES = [
  {
    title: 'Furnish',
    reference: '2 Timothy 3:16-17',
    points: [
      'We equip every believer with the Word, spiritual gifts, and tools for Kingdom living.',
      "We build people according to God's specification — with character, integrity, and diligence.",
      'We raise disciples who are grounded, growing, and ready for every good work.',
      "Nothing about God's design for you is incomplete. We are the place where you are fully furnished.",
    ],
  },
  {
    title: 'Transform',
    reference: 'Romans 12:2',
    points: [
      'Genuine renewal — in the individual, the family, the community.',
      'The Word of God changes lives, shapes character, and produces lasting impact.',
      'You may come broken — you will not leave broken. You may come small — you cannot remain small.',
      'Transformation is not a programme. It is the nature of this house.',
    ],
  },
  {
    title: 'Influence',
    reference: 'Matthew 5:13–14',
    points: [
      'Influence in Business',
      'Influence in Government',
      'Influence in Media',
      'Influence in Education',
      'Influence in Family',
      'Influence in Community',
    ],
  },
]

export function DNAClient() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = cardRefs.current.map((card, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => [...new Set([...prev, index])])
          }
        },
        { threshold: 0.2 }
      )

      if (card) {
        observer.observe(card)
      }

      return observer
    })

    return () => {
      observers.forEach((observer, index) => {
        if (cardRefs.current[index]) {
          observer.unobserve(cardRefs.current[index]!)
        }
      })
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
    >
      <div className="max-w-[var(--container-max)] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--church-green)' }}>
            A Reflection of Our Faith
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Our DNA
          </h2>
        </div>

        {/* 3-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DNA_VALUES.map((val, index) => {
            const isVisible = visibleCards.includes(index)
            return (
              <div
                key={val.title}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 cursor-default
                  transition-all duration-300 ease-in-out
                  hover:scale-[1.04] hover:-translate-y-1
                  hover:shadow-[0_20px_40px_-8px_rgba(27,34,119,0.15)]
                  hover:border-[rgba(27,34,119,0.15)]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-none
                    transition-colors duration-300 group-hover:bg-[rgba(27,34,119,1)]"
                  style={{ backgroundColor: 'var(--church-green)' }}
                >
                  {val.title[0]}
                </div>
                <div>
                  <h3
                    className="text-lg font-bold transition-colors duration-300"
                    style={{ color: 'rgba(27, 34, 119, 1)' }}
                  >
                    {val.title}
                  </h3>
                  <p className="text-xs font-semibold mt-1" style={{ color: 'var(--church-green)' }}>
                    {val.reference}
                  </p>
                </div>

                {/* Bulleted points with slide-down animation */}
                <ul className="flex flex-col gap-3">
                  {val.points.map((point, pointIndex) => (
                    <li
                      key={pointIndex}
                      className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed transition-all duration-700 ease-out"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
                        transitionDelay: `${pointIndex * 150}ms`,
                      }}
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-none"
                        style={{ backgroundColor: 'var(--church-green)' }}
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
