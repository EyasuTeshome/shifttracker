# Answering technical interview questions

## Learning objectives

- Practice answering technical interview questions in a mock interview setting.
- Communicate clearly and effectively in spoken English.
- Communicate technical concepts to other technical people.

### **Estimated time**: 2h

## Description

When asked a technical question, are you able to communicate your understanding with ease? If the answer is no, this lesson is for you!

In this lesson, you will practice your **technical articulation skills**. You will do so by practicing with a peer in a "mock interview"-type setting.

### Why should you practice your articulation

Articulation, also known as **the expression of ideas in an easy-to-understand manner**, is useful for many reasons:

- It helps to transfer knowledge to other team members
- You'll be better understood by peers with different roles (i.e. fellow engineers, project managers)
- Articulation helps to be more influential when you want to spread your ideas

The good thing is that it's a skill in itself that can be improved!

### The structure of a good answer

A good answer consists of the following components (in order):

1. ❓Clarification - Ask the interviewer to clarify the terms used
2. 📖 Definition - Give a definition of the concept
3. 🏞 Example - Provide a common use case or personal experience
4. 🤔 Opinion - Share your thoughts about the usefulness of the concept.

Imagine you're asked the following question:

> "What is web storage?"

Most people would jump right to the definition and then leave it there:

> "Web storage is a browser-based storage solution (like localStorage or sessionStorage) that allows a client to store non-sensitive data."

This is necessary part of the answer, but not enough to show the interviewer what you're capable of. Here's a more complete answer:

```md
(❓Clarification) What is meant with “web”? I.e frontend, web app or else?

(📖 Definition) In the context of web storage, “web” usually refers to the “browser“. With “storage” we refer to the location within browser where we can store (stringified) data. This is why it’s also known as “client-side storage”. The main reason it is used is because it allows a client to store non-sensitive data persistently."

(🏞 Example) An example of modern web storage is local storage and session storage. Local storage is persistent (which means the data remains across sessions), while session storage is session-specific. Use cases: shopping cart, quiz.

(🤔 Opinion) 1 pro of this approach is that we can quickly store and retrieve data without having to send an HTTP request to the server. 1 con is that we can’t store any sensitive data, so we would need send a POST request to a database.
```

Which answer is a better display of expertise? Probably the second one!

## Exercise

Now that you've learned a better approach to answering technical questions, it's time to practice. When better than in a mock interview? Select one person and follow the instructions:

1. Collect a set of questions that will be used as interview questions - **(5 min)**
   - [JavaScript](https://github.com/lydiahallie/javascript-questions)
   - [React](https://github.com/sudheerj/reactjs-interview-questions)
   - [Ruby](https://github.com/nick-brown/ruby-interview-questions)
   - [Rails](https://gist.github.com/ahmadhasankhan/cfa1ae00a2533cf10ab2)
   - [SQL](https://github.com/xoraus/CrackingTheSQLInterview)
2. Answer 5 questions using our **recommended approach** about 1 of the aforementioned technologies - **(10 min)**
3. Give feedback on the answers: structure and content - **(10 min)**
4. _Switch roles and repeat_
5. _(if both people went) Change technology and repeat_

⏰ **Time**: 60 minutes per person

**Guiding questions:**

- Do you understand what the interviewer means by the terms they're using?
- Can you think of an example to illustrate the concept?
- Is there a pro and con regarding the usage of this concept or tool?

### Additional materials

To learn more about technical articulation, check out these resources:

- [How to Answer Any Technical Interview Question](https://www.dice.com/career-advice/answer-technical-interview-question)

---

_If you spot any bugs or issues in this activity, you can [open an issue with your proposed change](https://github.com/microverseinc/curriculum-transversal-skills/blob/main/git-github/articles/open_issue.md)._
