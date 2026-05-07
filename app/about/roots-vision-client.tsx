'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export function RootsVisionClient() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section className="bg-white py-[var(--section-padding-y)] px-[var(--section-padding-x)]" ref={sectionRef}>
      <div className="max-w-[var(--container-max)] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left - Fade In */}
        <div
          className="flex flex-col gap-6 transition-all duration-1000 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Our Roots &amp; RCCG Vision
          </h2>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed">
            We are a parish of the Redeemed Christian Church of God, one of the fastest-growing churches in the world with membership in over 190 nations and still counting. Our local expression in Glory Tabernacle carries the global mandate:
          </p>
          <ul className="flex flex-col gap-2">
            {[
              'To make heaven and to take as many people as possible with us.',
              'To have a member of RCCG in every family in all nations.',
              'To accomplish these through planting churches within five minutes of every person.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-none" style={{ backgroundColor: 'var(--church-green)' }} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          {/* Two icon cards */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            {[
              { icon: '🌱', title: 'Our Heritage', body: 'Founded on the principles of holiness, prayer, and evangelism that have defined RCCG for decades.' },
              { icon: '🎯', title: 'Our Strategy', body: "We are a people called to build according to God's specification — furnishing lives unto good works with His Word, transforming hearts by His Spirit, and influencing every sphere of society with His Kingdom." },
            ].map((card) => (
              <div key={card.title} className="rounded-xl p-4 border border-gray-100 bg-gray-50 flex flex-col gap-2">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-sm font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Slide In from Right */}
        <div
          className="relative transition-all duration-1000 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(100px)',
          }}
        >
          <div
            className="rounded-2xl overflow-hidden bg-white"
            style={{ boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '400px' }}
          >
            <Image
              src="/fellowship.png"
              alt="RCCG Glory Tabernacle building"
              width={600}
              height={300}
              className="object-cover w-full h-full"
              style={{ filter: 'grayscale(20%) brightness(0.95)', maxHeight: '400px' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
