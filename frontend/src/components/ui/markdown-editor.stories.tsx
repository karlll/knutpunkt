import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { MarkdownEditor } from './markdown-editor'

const meta = {
  title: 'UI/MarkdownEditor',
  component: MarkdownEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MarkdownEditor>

export default meta
type Story = StoryObj<typeof meta>

const sampleMarkdown = `# Sample Task

## Overview

This is a sample task description with **markdown** formatting.

## Requirements

- Support for *italic* and **bold** text
- Code blocks with syntax highlighting
- Lists and checkboxes

## Acceptance Criteria

- [ ] Feature works as expected
- [ ] Tests are passing
- [ ] Documentation is updated

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`
`

// Wrapper component to handle state
function MarkdownEditorWithState(props: Partial<Parameters<typeof MarkdownEditor>[0]>) {
  const [value, setValue] = useState(props.value || sampleMarkdown)

  return (
    <div className="w-full max-w-3xl">
      <MarkdownEditor
        value={value}
        onChange={setValue}
        {...props}
      />
      <div className="mt-4 p-4 bg-muted rounded-md">
        <p className="text-sm font-semibold mb-2">Current Value Length:</p>
        <p className="text-sm text-muted-foreground">{value.length} characters</p>
      </div>
    </div>
  )
}

export const Default: Story = {
  args: {
    value: sampleMarkdown,
    onChange: () => {},
  },
  render: () => <MarkdownEditorWithState />,
}

export const WithVimMode: Story = {
  args: {
    value: sampleMarkdown,
    onChange: () => {},
    vimMode: true,
  },
  render: () => <MarkdownEditorWithState vimMode={true} />,
  parameters: {
    docs: {
      description: {
        story: 'Editor with Vim keybindings enabled. Press `i` to enter insert mode, `Esc` to return to normal mode.',
      },
    },
  },
}

export const Empty: Story = {
  args: {
    value: '',
    onChange: () => {},
  },
  render: () => <MarkdownEditorWithState value="" />,
  parameters: {
    docs: {
      description: {
        story: 'Empty editor ready for input.',
      },
    },
  },
}

export const WithPlaceholder: Story = {
  args: {
    value: '',
    onChange: () => {},
  },
  render: () => (
    <MarkdownEditorWithState
      value=""
    />
  ),
}

export const MinimalContent: Story = {
  args: {
    value: '# Quick Note\n\nJust a simple task description.',
    onChange: () => {},
  },
  render: () => (
    <MarkdownEditorWithState
      value="# Quick Note\n\nJust a simple task description."
    />
  ),
}

const longContentValue = `# Comprehensive Task Documentation

## Executive Summary

This task involves implementing a complex feature that requires careful planning and execution.

## Background

The current system has limitations that prevent users from achieving their goals efficiently.
We need to address these issues to improve user satisfaction and system performance.

## Requirements

### Functional Requirements

1. **User Authentication**
   - Support for OAuth 2.0
   - Session management
   - Password reset functionality

2. **Data Processing**
   - Handle large datasets (>1M records)
   - Real-time data synchronization
   - Error handling and retry logic

3. **API Integration**
   - RESTful API endpoints
   - GraphQL support
   - WebSocket connections

### Non-Functional Requirements

- Performance: Response time < 200ms
- Scalability: Support 10k concurrent users
- Security: OWASP compliance
- Accessibility: WCAG 2.1 Level AA

## Technical Approach

### Architecture

We'll use a microservices architecture with the following components:

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   API GW    │────▶│  Services   │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    Cache    │     │  Database   │
                    └─────────────┘     └─────────────┘
\`\`\`

### Implementation Steps

1. Set up development environment
2. Create database schema
3. Implement backend services
4. Build frontend components
5. Integration testing
6. Performance optimization
7. Security audit
8. Documentation

## Acceptance Criteria

- [ ] All functional requirements implemented
- [ ] Performance benchmarks met
- [ ] Security scan passes
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Code review approved
- [ ] QA sign-off received

## Timeline

- Week 1-2: Architecture and setup
- Week 3-4: Backend implementation
- Week 5-6: Frontend implementation
- Week 7: Testing and optimization
- Week 8: Documentation and deployment

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API changes | High | Medium | Version locking |
| Performance issues | High | Low | Load testing |
| Security vulnerabilities | Critical | Low | Security audit |

## References

- [API Documentation](https://example.com/api)
- [Design System](https://example.com/design)
- [Architecture Guide](https://example.com/arch)
`

export const LongContent: Story = {
  args: {
    value: longContentValue,
    onChange: () => {},
  },
  render: () => (
    <MarkdownEditorWithState
      value={longContentValue}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Editor with extensive content demonstrating scrolling behavior.',
      },
    },
  },
}
