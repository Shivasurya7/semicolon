import {
  Blocks,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChartLine,
  Code2,
  Infinity as InfinityIcon,
  Timer,
  Users,
} from 'lucide-react'
import type { CodeToken, Faq, ModuleLink } from './landing.types.ts'

// Static copy and navigation for the landing page (UI_Generation_Prompts Prompt 1). Not mock data: it ships as is.

export const productModules: ModuleLink[] = [
  { name: 'Problems', icon: Code2, to: '/problems', description: 'Coding problems with hidden tests' },
  { name: 'Mock tests', icon: Timer, to: '/mock-tests', description: 'Timed rounds with a final report' },
  { name: 'System Design', icon: Boxes, to: '/design/hld', description: 'High-level design questions and editorials' },
  { name: 'Low-Level Design', icon: Blocks, to: '/design/lld', description: 'Class design and patterns' },
  { name: 'DevOps', icon: InfinityIcon, to: '/devops', description: 'Theory and quizzes by topic' },
  { name: 'Data Science', icon: ChartLine, to: '/data-science', description: 'Theory and quizzes by topic' },
  { name: 'Companies', icon: Building2, to: '/companies', description: 'Questions asked at each company' },
  { name: 'Projects', icon: BriefcaseBusiness, to: '/projects', description: 'Take-home and portfolio briefs' },
]

export const moduleChips: Array<{ label: string; icon: ModuleLink['icon']; to: string }> = [
  { label: 'Data Structures & Algorithms', icon: Code2, to: '/problems' },
  { label: 'System Design', icon: Boxes, to: '/design/hld' },
  { label: 'Low-Level Design', icon: Blocks, to: '/design/lld' },
  { label: 'DevOps', icon: InfinityIcon, to: '/devops' },
  { label: 'Data Science', icon: ChartLine, to: '/data-science' },
  { label: 'Company prep', icon: Building2, to: '/companies' },
  { label: 'Projects', icon: BriefcaseBusiness, to: '/projects' },
  { label: 'Community', icon: Users, to: '/community' },
]

export const navLinks: Array<{ label: string; href: string; isRoute: boolean }> = [
  { label: 'How it works', href: '#how-it-works', isRoute: false },
  { label: 'Community', href: '/community', isRoute: true },
  { label: 'Pricing', href: '#pricing', isRoute: false },
]

export const painPoints: string[] = [
  'Problem sets built for interviews abroad, not campus rounds',
  "Prices in dollars that a student budget can't stretch to",
  'No way to rehearse a timed test before the real one',
  "Not knowing which topics you're weakest in",
  'Practising alone with no sense of where you stand',
  'Wrong answers with no clue what went wrong',
]

export const steps: Array<{ title: string; body: string }> = [
  { title: 'Sign up free', body: 'Create your account in seconds with Google or GitHub. No payment details needed.' },
  {
    title: 'Pick a topic',
    body: 'Choose a topic like Arrays, Graphs or Dynamic Programming and start with Easy problems.',
  },
  {
    title: 'Solve and submit',
    body: 'Write your solution in the browser editor, run the sample tests, then submit against the hidden tests.',
  },
  {
    title: 'Take a mock test',
    body: 'Try the free timed mock test and get a report with a verdict for every problem.',
  },
]

export const freePlanFeatures: string[] = [
  'Free problems in every topic',
  'Full IDE with Run and Submit',
  'Weekly leaderboard',
  '1 free mock test',
]

export const premiumPlanFeatures: string[] = [
  'Every problem in the catalog',
  'Unlimited mock tests with reports',
  'Editorial solutions for every problem',
  'All of Free',
]

export const faqs: Faq[] = [
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. Free gives you a set of free problems in every topic, the full editor with Run and Submit, the weekly leaderboard and one free mock test. No card needed.',
  },
  {
    question: 'Does Premium renew automatically?',
    answer:
      'No. Premium is a one-time payment for a fixed period. When it ends you go back to Free, and you can buy again whenever you like — a new purchase adds to any time you have left.',
  },
  {
    question: 'What is the refund policy?',
    answer:
      "You can get a full refund within 7 days of paying, as long as you haven't started a mock test. Write to support and we'll process it.",
  },
  { question: 'Which languages can I code in?', answer: 'C, C++, Java and Python 3.' },
  {
    question: 'Can I practise on my phone?',
    answer:
      'You can browse problems, read statements and editorials, and check the leaderboard on a phone. Writing and running code needs a laptop or desktop browser.',
  },
  {
    question: 'How do mock tests work?',
    answer:
      "A mock test is a timed set of problems. The timer runs on our server and can't be paused. When time is up you get a report with a verdict for every problem. The free test allows one attempt.",
  },
  { question: 'Which payment methods do you accept?', answer: 'UPI, cards and netbanking, through Razorpay.' },
]

const k = (text: string): CodeToken => ({ text, tone: 'keyword' })
const c = (text: string): CodeToken => ({ text, tone: 'control' })
const f = (text: string): CodeToken => ({ text, tone: 'function' })
const d = (text: string): CodeToken => ({ text, tone: 'default' })
const t = (text: string): CodeToken => ({ text, tone: 'type' })
const cm = (text: string): CodeToken => ({ text, tone: 'comment' })

// Decorative Python shown in the Workspace montage; line 8 renders as the active line.
export const montageCode: CodeToken[][] = [
  [k('class '), t('Solution'), d(':')],
  [d('    '), k('def '), f('twoSum'), d('(self, nums, target):')],
  [d('        '), cm('# Time: O(n) · Space: O(n)')],
  [d('        seen = {}')],
  [d('        '), c('for '), d('i, n '), c('in '), f('enumerate'), d('(nums):')],
  [d('            need = target - n')],
  [d('            '), c('if '), d('need '), c('in '), d('seen:')],
  [d('                '), c('return '), d('[seen[need], i]')],
  [d('            seen[n] = i')],
  [d('        '), c('return '), d('[]')],
]

export const MONTAGE_ACTIVE_LINE = 8
