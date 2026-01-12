'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CyberpunkPlaceholder } from './CyberpunkPlaceholder'

interface NewsImageProps {
  src: string | null | undefined
  alt: string
  coinName?: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
}

export function NewsImage({ src, alt, coinName, className = '', fill, width, height }: NewsImageProps) {
  const [hasError, setHasError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  if (!src || hasError) {
    return <CyberpunkPlaceholder coinName={coinName} />
  }

  if (fill) {
    return (
      <>
        {!imageLoaded && (
          <div className="absolute inset-0">
            <CyberpunkPlaceholder coinName={coinName} />
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          fill
          className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setHasError(true)}
        />
      </>
    )
  }

  return (
    <>
      {!imageLoaded && (
        <div className="absolute inset-0">
          <CyberpunkPlaceholder coinName={coinName} />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setHasError(true)}
      />
    </>
  )
}
