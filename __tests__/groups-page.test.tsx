/**
 * Unit tests for GroupsPage component
 * Validates: Requirements 1.1, 1.2, 1.3
 */
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GroupsPage from '@/app/groups/page'

describe('GroupsPage', () => {
  test('renders without errors', () => {
    expect(() => render(<GroupsPage />)).not.toThrow()
  })

  test('includes TopNavBar component', () => {
    render(<GroupsPage />)
    
    // TopNavBar should render navigation elements
    // Check for common nav elements like logo or navigation links
    const nav = document.querySelector('nav')
    expect(nav).toBeTruthy()
  })

  test('includes Footer component', () => {
    render(<GroupsPage />)
    
    // Footer should render at the bottom
    // Check for footer element or common footer content
    const footer = document.querySelector('footer')
    expect(footer).toBeTruthy()
  })

  test('renders main hero section with title', () => {
    render(<GroupsPage />)
    
    // Check for the hero title "Where You Fit"
    const heroTitle = screen.getByText('Where You Fit')
    expect(heroTitle).toBeTruthy()
  })

  test('renders ministry groups section', () => {
    render(<GroupsPage />)
    
    // Check for at least one ministry group title
    const mensMinistry = screen.getByText("Men's Ministry")
    expect(mensMinistry).toBeTruthy()
  })

  /**
   * Task 9.2: Verify all groups are rendered
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
   */
  describe('All Groups Rendering', () => {
    test('renders all 6 group sections', () => {
      render(<GroupsPage />)
      
      // Verify all 6 group titles are present
      expect(screen.getByText("Men's Ministry")).toBeTruthy()
      expect(screen.getByText("Women's Ministry")).toBeTruthy()
      expect(screen.getByText('Youth Ministry')).toBeTruthy()
      expect(screen.getByText('House Fellowship')).toBeTruthy()
      expect(screen.getByText('Prayer Ministry')).toBeTruthy()
      expect(screen.getByText('Worship Team')).toBeTruthy()
    })

    test('each group has a title', () => {
      render(<GroupsPage />)
      
      // Get all h3 headings (group titles)
      const groupTitles = document.querySelectorAll('h3')
      
      // Should have at least 6 group titles
      expect(groupTitles.length).toBeGreaterThanOrEqual(6)
      
      // Verify they are not empty
      groupTitles.forEach(title => {
        expect(title.textContent).toBeTruthy()
        expect(title.textContent!.length).toBeGreaterThan(0)
      })
    })

    test('each group has a description', () => {
      render(<GroupsPage />)
      
      // Verify descriptions are present for each group
      const descriptions = [
        /brotherhood dedicated to spiritual growth/i,
        /community of women supporting each other/i,
        /Empowering the next generation/i,
        /Small groups meeting in homes/i,
        /powerhouse of our church/i,
        /Using music and creative arts/i,
      ]
      
      descriptions.forEach(description => {
        expect(screen.getByText(description)).toBeTruthy()
      })
    })

    test('each group has an image', () => {
      render(<GroupsPage />)
      
      // Get all images in the document
      const images = document.querySelectorAll('img')
      
      // Filter for group images (exclude nav, footer, newsletter images)
      const groupImages = Array.from(images).filter(img => {
        const alt = img.getAttribute('alt') || ''
        return alt.includes('Ministry') || 
               alt.includes('Fellowship') || 
               alt.includes('Worship') ||
               alt.includes('Youth')
      })
      
      // Should have 6 group images
      expect(groupImages.length).toBe(6)
      
      // Verify each image has proper attributes
      groupImages.forEach(img => {
        expect(img.getAttribute('alt')).toBeTruthy()
        expect(img.getAttribute('src')).toBeTruthy()
      })
    })

    test('CTA buttons are present for all groups', () => {
      render(<GroupsPage />)
      
      // Get all "Learn More" buttons
      const ctaButtons = screen.getAllByText('Learn More')
      
      // Should have 6 CTA buttons (one for each group)
      expect(ctaButtons.length).toBe(6)
      
      // Verify each button is a link with href
      ctaButtons.forEach(button => {
        const link = button.closest('a')
        expect(link).toBeTruthy()
        expect(link?.getAttribute('href')).toBeTruthy()
      })
    })

    test('all group sections have proper structure', () => {
      render(<GroupsPage />)
      
      // Verify all articles (group sections) are present
      const articles = document.querySelectorAll('article')
      expect(articles.length).toBe(6)
      
      // Each article should contain:
      // - An image
      // - A title (h3)
      // - A description (p)
      // - A CTA button (a)
      articles.forEach(article => {
        const image = article.querySelector('img')
        const title = article.querySelector('h3')
        const description = article.querySelector('p')
        const ctaButton = article.querySelector('a')
        
        expect(image).toBeTruthy()
        expect(title).toBeTruthy()
        expect(description).toBeTruthy()
        expect(ctaButton).toBeTruthy()
      })
    })
  })

  /**
   * Task 9.3: Verify alternating layout logic
   * Validates: Requirements 3.1, 3.2, 6.1, 6.2
   */
  describe('Alternating Layout Logic', () => {
    test('odd-indexed groups (0, 2, 4) have image on left', () => {
      render(<GroupsPage />)
      
      const articles = document.querySelectorAll('article')
      
      // Check odd-indexed groups (0, 2, 4)
      const oddIndexedArticles = [articles[0], articles[2], articles[4]]
      
      oddIndexedArticles.forEach((article, idx) => {
        // Find the image container div
        const imageDiv = article.querySelector('div[class*="aspect-[4/3]"]')
        expect(imageDiv).toBeTruthy()
        
        // For odd-indexed groups (image on left), the image div should NOT have md:col-start-2
        const imageClasses = imageDiv?.className || ''
        expect(imageClasses).not.toContain('md:col-start-2')
      })
    })

    test('even-indexed groups (1, 3, 5) have image on right', () => {
      render(<GroupsPage />)
      
      const articles = document.querySelectorAll('article')
      
      // Check even-indexed groups (1, 3, 5)
      const evenIndexedArticles = [articles[1], articles[3], articles[5]]
      
      evenIndexedArticles.forEach((article) => {
        // Find the image container div
        const imageDiv = article.querySelector('div[class*="aspect-[4/3]"]')
        expect(imageDiv).toBeTruthy()
        
        // For even-indexed groups (image on right), the image div should have md:col-start-2
        const imageClasses = imageDiv?.className || ''
        expect(imageClasses).toContain('md:col-start-2')
      })
    })

    test('text content positioning alternates correctly', () => {
      render(<GroupsPage />)
      
      const articles = document.querySelectorAll('article')
      
      articles.forEach((article, index) => {
        // Find the text content div (contains h3 title)
        const textDiv = article.querySelector('div:has(h3)')
        expect(textDiv).toBeTruthy()
        
        const textClasses = textDiv?.className || ''
        
        if (index % 2 === 0) {
          // Odd-indexed groups: text should NOT have md:col-start-1 md:row-start-1
          expect(textClasses).not.toContain('md:col-start-1')
          expect(textClasses).not.toContain('md:row-start-1')
        } else {
          // Even-indexed groups: text should have md:col-start-1 md:row-start-1
          expect(textClasses).toContain('md:col-start-1')
          expect(textClasses).toContain('md:row-start-1')
        }
      })
    })

    test('all articles use grid layout with proper classes', () => {
      render(<GroupsPage />)
      
      const articles = document.querySelectorAll('article')
      
      articles.forEach((article, index) => {
        const articleClasses = article.className
        
        // All articles should have grid layout classes
        expect(articleClasses).toContain('grid')
        expect(articleClasses).toContain('grid-cols-1')
        expect(articleClasses).toContain('md:grid-cols-2')
        expect(articleClasses).toContain('items-center')
        
        // Even-indexed groups should have md:grid-flow-dense
        if (index % 2 !== 0) {
          expect(articleClasses).toContain('md:grid-flow-dense')
        }
      })
    })

    test('responsive behavior: mobile layout stacks content', () => {
      render(<GroupsPage />)
      
      const articles = document.querySelectorAll('article')
      
      articles.forEach((article) => {
        const articleClasses = article.className
        
        // All articles should have grid-cols-1 for mobile (stacked layout)
        expect(articleClasses).toContain('grid-cols-1')
        
        // Desktop should use 2 columns
        expect(articleClasses).toContain('md:grid-cols-2')
      })
    })

    test('responsive behavior: images maintain aspect ratio', () => {
      render(<GroupsPage />)
      
      const articles = document.querySelectorAll('article')
      
      articles.forEach((article) => {
        const imageDiv = article.querySelector('div[class*="aspect-[4/3]"]')
        expect(imageDiv).toBeTruthy()
        
        const imageClasses = imageDiv?.className || ''
        
        // Verify aspect ratio class is present
        expect(imageClasses).toContain('aspect-[4/3]')
        
        // Verify rounded corners
        expect(imageClasses).toContain('rounded-2xl')
        
        // Verify overflow hidden for proper image clipping
        expect(imageClasses).toContain('overflow-hidden')
      })
    })

    test('responsive behavior: proper gap spacing at different breakpoints', () => {
      render(<GroupsPage />)
      
      const articles = document.querySelectorAll('article')
      
      articles.forEach((article) => {
        const articleClasses = article.className
        
        // Verify gap classes for responsive spacing
        expect(articleClasses).toMatch(/gap-\d+/)
        expect(articleClasses).toMatch(/lg:gap-\d+/)
      })
    })
  })
})
