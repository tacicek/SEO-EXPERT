# SEO Expert AI Editor

AI-Powered SEO Content Analysis and Optimization Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 Overview

SEO Expert AI Editor is an advanced AI-powered platform that analyzes web content from a real SEO expert's perspective, provides sentence-level evaluation, and offers actionable recommendations. Unlike traditional keyword-focused SEO tools, this system evaluates content based on Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) criteria.

### Key Features

- **🎨 Sentence-Level Color Coding**: Visual feedback with Green/Orange/Red evaluation for each sentence
- **🤖 AI-Powered Analysis**: Uses Claude AI to analyze content from an expert perspective
- **📊 E-E-A-T Scoring**: Comprehensive evaluation based on Google's quality guidelines
- **💡 Actionable Suggestions**: Not just problem identification, but specific solutions
- **⚡ Real-time Analysis**: Fast content analysis with instant results
- **🎯 Expert Perspective**: Evaluates if content was written by a true expert

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key (Claude)
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/seo-expert-ai-editor.git
   cd seo-expert-ai-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your API keys in `.env.local`**
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Analyzing Content

1. **Enter URL**: Paste the URL of any article or blog post you want to analyze
2. **Wait for Analysis**: The AI will analyze each sentence comprehensively
3. **Review Results**: See color-coded sentences and detailed suggestions
4. **Apply Fixes**: Click on problematic sentences to see and apply improvements

### Understanding Color Codes

| Color | Meaning | Action Required |
|-------|---------|----------------|
| 🟢 **GREEN** | Good quality sentence. Expert perspective, adds value, trustworthy. | No change needed |
| 🟠 **ORANGE** | Can be improved. Lacks specificity, could use examples or sources. | Consider applying suggestion |
| 🔴 **RED** | Critical issue. Wrong information, empty content, or trust-damaging. | Urgent correction needed |

### E-E-A-T Analysis

The system evaluates content across four dimensions:

- **Experience**: First-hand knowledge and real-world usage
- **Expertise**: Deep knowledge and technical understanding
- **Authoritativeness**: Recognition and credibility
- **Trustworthiness**: Reliability and transparency

## 🏗️ Project Structure

```
seo-expert-ai-editor/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── analyze/          # Analysis endpoint
│   ├── editor/               # Editor page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── editor/               # Editor components
│   │   ├── ContentEditor.tsx
│   │   └── SuggestionPanel.tsx
│   ├── layout/               # Layout components
│   ├── reports/              # Report components
│   │   └── EEATReport.tsx
│   └── ui/                   # UI components (shadcn)
├── lib/                      # Utilities and core logic
│   ├── ai/                   # AI integration
│   │   ├── analyzer.ts       # Content analysis logic
│   │   └── prompts.ts        # AI prompts
│   ├── hooks/                # React hooks
│   ├── providers/            # Context providers
│   ├── scraper/              # Web scraping
│   ├── store/                # State management
│   └── types/                # TypeScript types
├── prompts/                  # AI system prompts
│   └── master_system_prompt.md
└── public/                   # Static assets
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - UI component system
- **Zustand** - State management
- **TanStack Query** - Server state management

### Backend
- **Next.js API Routes** - API endpoints
- **Anthropic Claude API** - AI analysis
- **Cheerio** - Web scraping and HTML parsing

## 📊 Analysis Process

1. **Content Fetching**: URL is fetched and parsed using Cheerio
2. **Sentence Splitting**: Content is split into individual sentences
3. **AI Analysis**: Each sentence is analyzed by Claude AI
4. **E-E-A-T Evaluation**: Content is evaluated across four dimensions
5. **Suggestion Generation**: AI provides specific improvement suggestions
6. **Results Display**: Color-coded editor with interactive suggestions

## 🔑 Environment Variables

Required environment variables:

```env
# AI Provider Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Analysis Configuration
MAX_CONTENT_LENGTH=50000
DEFAULT_ANALYSIS_TIMEOUT=120000
```

## 🎨 Features in Detail

### Sentence-Level Analysis

Each sentence is evaluated based on:
- **Accuracy**: Is the information correct?
- **Value**: Does it add real value?
- **Specificity**: Is it concrete or vague?
- **Trustworthiness**: Does it build trust?
- **Expertise**: Does it show knowledge?
- **Readability**: Is it clear and understandable?
- **Context Fit**: Does it flow logically?

### E-E-A-T Scoring

Comprehensive analysis based on:
- First-person experience expressions
- Technical terminology usage
- External reference links
- Author credentials
- Content freshness
- Privacy and security signals

### Priority Actions

The system automatically generates a prioritized list of actions:
- **High Priority**: Critical issues requiring immediate attention
- **Medium Priority**: Important improvements
- **Low Priority**: Nice-to-have enhancements

## 🚧 Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
npm run start
```

### Code Quality

```bash
npm run lint
```

## 📝 API Reference

### POST /api/analyze

Analyze content from URL or raw text.

**Request Body:**
```json
{
  "url": "https://example.com/article",
  "content": "Optional direct content",
  "title": "Optional title",
  "topic": "Optional topic hint"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis_id",
    "title": "Article Title",
    "content_summary": {
      "detected_topic": "SEO Tools",
      "expertise_required": "medium",
      "target_audience": "Content Creators",
      "overall_score": 68,
      "expert_verdict": "..."
    },
    "sentence_analysis": [...],
    "eeat_scores": {...},
    "statistics": {...},
    "priority_actions": [...]
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Based on Google's E-E-A-T guidelines from [Search Quality Rater Guidelines](https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf)

## 📞 Support

For support, email support@seoexpertai.com or open an issue in the GitHub repository.

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Link analysis module
- [ ] Topical Authority analysis
- [ ] Competitor comparison
- [ ] User authentication
- [ ] Saved analyses history
- [ ] Export reports (PDF, DOCX)
- [ ] Browser extension
- [ ] WordPress plugin

---

**Version**: 1.0.0  
**Last Updated**: November 30, 2025  
**Maintained by**: SEO Expert AI Team

Made with ❤️ for content creators and SEO professionals
