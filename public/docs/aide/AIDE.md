 # 📚 AIDE - Artificial Intelligence for Development Engineers

<img src="/docs/aide/AIDE.jpg" align="left" width="180" style="margin-right: 15px;">
Agents can operate on par with experienced human software developers and contribute to impressive productivity gains. However, without stringent guidance, they quickly produce redundant, inconsistent, and poorly structured code mountains that no human wants to read anymore. And - even more importantly - humans can no longer take responsibility for the correct functioning of such systems.

But there is a different way.

AIDE proves that *it depends on us humans what comes out*. We can develop medium-sized systems with professional software architecture in collaboration with AI agents.

To do this, in addition to describing our functional requirements, we must employ numerous templates and architecture prompts that guide the agent's behavior so that it acts like a member of a professional development team.

The key to success is to *establish and maintain cooperation between human and agent on multiple levels (Design, Planning, Coding, Test)*, without leaving the agent's potential untapped through overly tight control. We call this concept [Human Periodically in the Loop](#human-periodically-in-the-loop)".

---

## AIDE - Application Systems

We plan to develop several systems from very different domains, from games to business information systems and social systems to technical applications (embedded systems).

The systems are intended to serve as demonstration objects in in-house training and at universities. They should be useful as starting points for further development or reengineering steps.

They will be published on https://github.com/aide-examples under an open source license which allows the use for academic and commercial training as long as a reference is kept to the original source of the material.

We try to keep the requirements for the development and execution environment of AIDE systems as simple as possible. For embedded systems, however, this principle naturally has certain limits.

### AIDE - Quiz
The first AIDE application is an online quiz game with a relatively simple architecture of web UI and server components with a database. It currently comprises approximately 20,000 lines (code and documentation). This makes it complex enough to demonstrate certain principles of good design. At the same time, the domain is so simple that it can be understood in a few minutes.

### AIDE Solar
The second AIDE application could be a technical system that transforms the energy of a solar panel so that it can charge USB devices. It should transmit data about the generated energy to a web host. Automated firmware updates are of course also part of it.

---

## Human Periodically in the Loop

The classic models of *human-in-the-loop* and *human-out-of-the-loop* are not suitable for AIDE.
The former is not suitable because we thereby degrade the agent to a code-completion editor, the latter is not suitable because everything slips away from us.

<img src="/docs/aide/Loop.jpg" align="left" width="180" style="margin-right: 15px;">

We see *human-sporadically-in-the-loop* and *human-periodically-in-the-loop* as alternatives.
*Sporadically* would mean that the human dives into the world of technical artifacts rather randomly or, for example, on the occasion of an occurring error, identifies problems, perhaps even solves them themselves. However, it turns out that with increasing distance from the code, the human tends to increasingly desperately urge the AI to fix the error. This often results in catastrophic tinkering and superficial fixing, old errors reoccur, and both together lose the ground under their feet. Incidentally, they both tend to gloss over or even deny this circumstance.

Our answer, *human-periodically-in-the-loop*, we derive partly from our own experience, partly from observing industries where the problem has existed for some time that machines can in principle master a process very well, and yet for good reasons we as humans do not want to transfer full responsibility to them.

A good example of this is aviation. It's no coincidence that professional pilots must repeatedly fly landings manually, even though the autopilot might perform a more perfect landing in difficult wind conditions than they themselves would. Professional pilots are quite afraid of checks in the simulator because there they are systematically challenged to the limit of their abilities.

**We derive the following guidelines for *human-periodically-in-the-loop*:**

* The human must fundamentally possess sufficient competence to reliably comprehend at the detail level what the agent suggests or has produced. If a single human cannot do the job, then there must be several of them who are specialized in different technical artifacts (database design, performance optimization, etc.).
* The human must possess sufficient time and self-discipline to repeatedly take deep insights into machine-generated work results at critical points. Since we don't want to rely only on their good will, we must *periodically* compel them to do so. Hence the name.
* There must be reviews by neutral third parties in which both the human and the machine must separately prove that each of them still has everything under control. We must learn to organize this process (quasi the simulator hour for software developers).
* In our opinion also the AI must be challenged because we need to rely on its ability to defend existing arcitecture principles against loss of clarity or corruption. In analogy to "intrusion testing" we have a setting in mind where a human (or an adversarial AI) introduces bad changes into documentation or code and where we expect our trained AI agent to critisize and object.
* Systematization and compulsion are only a safety net. Above all, the human must develop good instincts to recognize critical points. They must sense when it's good to watch the agent's hands very closely. Conversely, they must also recognize when to use it as a partner and advisor or when they can give it complete free rein.
* The human may be happy that the agent takes care of tedious routine tasks, and he must know that he pays a price for it in the form of growing inner distance from technical results (like database definitions or source code). Keeping this distance at the right level - that is the central challenge of AIDE.

---

## AIDE-Techkit : Building Blocks for Platform Construction

A well designed software system clearly separates T-components and A-components, where T stands for TECHNICAL Architectue and A stands for APPLICATION Domain. Although there may be needs to intermix the physical manifestations of these components within artefacts (like introducing error handling code and logging at many places within the source code) conceptually T and A are different animals.

- To understand WHAT a system does you focus on (A), to understand HOW it does it your focus is on (T). 
- When maintaining a productive system you are more or less captured within (T) and work on extending and changing (A).
- Changing (T) in a running system requires considerable amounts of re-engineerineg effort which in most cases is economically not worth doing - unless your platform depends on external components which come to the end of their supported life time.
- When thinking about a new system the natural focus is on A-requirements but you need to be well aware of T-requirements (often called NFR = non-functional requirements).
- When you start development of a new system you should begin with a rich and stable set of T components and a very tiny piece of A. This is the most critical phase of your project, because mistakes here will be very expensive to correct.

Our long term goal is to *provide T-building blocks for that phase* which work well together and can be selected according to your needs. We call it the AIDE-Techkit. Our idea is to extract almost all application related code from our AIDE systems so that we end up with standardized reusable T-components. Standardized means: They follow a common philosophy and have similar logical APIs although they are implemented differently due to programming language and runtime environment restrictions. 

In future the AI will know the AIDE-Techkit and help you to find and integrate the most appropriate building blocks for your intended platform and your NFRs. You will end up with a professional T-system which can be used to implement your minimal valuable solution (MVS) from the A-perspective. Ideally the chosen T-configuration will not change very much during the development of your system.

To give you an example: The AIDE Quiz contains three different mechanisms to support multiple languages: (a) Google Translator embedding, (b) DEEPL pre-translated valuable content which is cached by the application server, (c) thoroughly internationalized (i18n) UI items, system messages etc. Depending on the profile of you application you should be able to opt-IN or opt-OUT these different approaches.


## Consequences for Computer Science Education

We have written a [small paper](link will follow) that outlines the consequences of our findings for computer science education.

## The Authors

* Dr. Gero Scholz
* plus N.N.
* ..
* ..
