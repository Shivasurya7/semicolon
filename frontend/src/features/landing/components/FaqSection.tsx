import { Accordion, AccordionItem } from '../../../components/patterns/Accordion.tsx'
import type { Faq } from '../landing.types.ts'
import { MarketingContainer } from './MarketingContainer.tsx'

interface FaqSectionProps {
  faqs: Faq[]
}

export function FaqSection({ faqs }: FaqSectionProps) {
  if (faqs.length === 0) return null
  return (
    <section id="faq" aria-labelledby="faq-title">
      <MarketingContainer>
        <h2 id="faq-title" className="text-center text-h2-marketing font-medium text-strong">
          Frequently asked questions
        </h2>
        <Accordion className="mx-auto mt-12 max-w-[45rem]">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} title={faq.question}>
              <p className="pb-6 text-[1rem] leading-[1.6] text-secondary">{faq.answer}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </MarketingContainer>
    </section>
  )
}
