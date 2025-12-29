# Platform Selection

## The Question

There are many established platforms that could serve as a foundation for an online quiz system:

- **Content Management Systems** like WordPress, Drupal, or Joomla
- **Wiki Systems** like MediaWiki or DokuWiki
- **Learning Management Systems** like Moodle or Canvas

All of these offer a concept of **Plugins** or **Extensions** that could be used to implement quiz functionality. In fact, many such quiz plugins already exist.

So why not take that approach?

## The Answer: Architectural Freedom

The primary goal of AIDE Quiz is **educational**: to demonstrate how to design and build a well-architected software system from the ground up.

### What We Gain by Building From Scratch

1. **Clean Architecture**
   - We can implement proper layered architecture (Router → Service → Repository)
   - We control the entire dependency injection structure
   - No compromises due to framework constraints

2. **Clear Patterns**
   - Every design decision is visible and intentional
   - Students can trace data flow from HTTP request to database and back
   - No "magic" hidden in framework internals

3. **Focused Codebase**
   - Only code that serves our purpose
   - No bloat from unused platform features
   - Easy to understand the complete system

4. **Learning Opportunity**
   - Understanding how web applications really work
   - Implementing security, validation, and error handling ourselves
   - Making architectural trade-offs consciously

### What We Would Lose with an Existing Platform

Building on WordPress or MediaWiki would impose severe constraints:

| Aspect | Platform Constraint | Our Approach |
|--------|---------------------|--------------|
| **Data Model** | Must fit platform's database schema | Custom schema optimized for quizzes |
| **API Design** | Limited to platform's REST/hook system | Clean, purpose-built REST API |
| **Authentication** | Platform's user system | Lightweight teacher authentication |
| **Frontend** | Theme/template restrictions | Modern vanilla JS architecture |
| **Dependencies** | PHP + platform's stack | Node.js + minimal dependencies |

### The Trade-Off

Yes, we lose the "free" features that come with established platforms:
- User management, permissions, roles
- Admin interfaces
- Plugin ecosystems
- Community support

But for an **educational project**, these "free" features would actually be **obstacles**. They would hide the very concepts we want to teach.

## Conclusion

AIDE Quiz exists to show that building a well-structured application from scratch is:
- **Achievable** with modern tools and AI assistance
- **Educational** for understanding software architecture
- **Maintainable** when following clear patterns

The goal is not to compete with WordPress quiz plugins. The goal is to learn how software systems are built.

---

*See [DEVELOPMENT GUIDELINES](DEVELOPMENT_GUIDELINES.md) for the architectural patterns we chose.*
