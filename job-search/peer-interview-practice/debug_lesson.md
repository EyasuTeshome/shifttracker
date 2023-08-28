# Deal with common issues during live coding: debug

## Description

Many times your code won’t work as expected. And according to [Murphy’s law](https://en.wikipedia.org/wiki/Murphy%27s_law) - that will most likely happen during the job interview. Sometimes debugging code is even an explicit task during job interviews. Mastering that can give you a big advantage!

### Why is it important?

Debugging is definitely a part of a programmer’s job, and this skill is important in itself. In addition, having problems with code during a live coding session might be very stressful for you. Practicing strategies to deal with this can really reduce that stress.

### Guidelines to follow

Review the following guidelines that will help you to make sure that you set up yourself for success when debugging the code.

**Context**
*You are at a technical interview. You are almost done with your coding challenge but you discover that something does not work as expected.*

1. **Describe how the code should work.**
    1. If it is your own code: take a moment to describe out loud what the purpose of the code is.
    2. If you are debugging existing code: rephrase what your interviewer said to make sure that you are on the same page.
2. **Run the code to see what goes wrong.** Read the output carefully.
3. **Track the piece of code with a problem.**
    - Use common sense: what test case gives you the wrong output? Which part of the code is responsible for that?
    - Use any output method that is available. In online challenges most likely it will be ‘puts’ for Ruby and `console.log` for JavaScript. If available, you can also use debugging tools, e.g. `binding.pry` for Ruby or `debugger` for JavaScript.
4. **Say aloud what you are suspecting even if you are not 100% sure**.
    1. It is important because that will show the interviewer the way you are thinking. In addition, they can give you hints if necessary.
5. **Fix the bug!**

### See it in action

Watch the following video to see an example of an interviewee following the above guideline.

 
 [![Watch the video](https://img.youtube.com/vi/u8ojGK0Hx90/0.jpg)](https://www.youtube.com/watch?v=u8ojGK0Hx90)

---

*If you spot any bugs or issues in this activity, you can [open an issue with your proposed change](https://github.com/microverseinc/curriculum-transversal-skills/blob/main/git-github/articles/open_issue.md).*
