# Deal with common issues during project presentation: bug

## Description

Presenting your project from the past might be considered the easiest part of the technical interview as you can prepare for it in advance. However, even in this case, your stress level can be your worst enemy. This lesson will help you to prepare for the situation when some feature stops working in the middle of the presentation. 

### Why is it important?

Even if you polish your website before the presentation, something can break without any obvious reason. If that happens during your presentation, it can really stress you out. As people, we have a tendency to try to fix this kind of issue by all means.
However, the debugging process might be very time-consuming, and letting it last too long can take up your very limited time during the job interview.
It would be best to quickly fix the bug and move on to other parts of the interview but is not always possible.
You need to be smart enough to limit yourself and don't lose a chance to show all your skills.

### Guidelines to follow

Review the following guidelines that will help you to overcome the debugging during the presentation challenge.

**Context**
*You are in the middle of the technical interview. You are presenting your project but all of the sudden some feature stops working.*

First of all, remember Murphy's law: even if your project was working perfectly there is a big chance that something will break during the presentation. There is nothing to do to prevent it 100% of the time. So, usually the first thing to do is to take a breath and calm down.
Then follow the guidelines below:

1. **Acknowledge that something does not work as it should**. If you do that your audience will be aware of the issue.
    - For example: *Sorry, submitting this form does not work as it should. Which is strange because it worked perfectly when I was preparing for this presentation.*
3. **Explain how the feature is supposed to work**.
   - For example: *After clicking the "submit" button we should be redirected to the list of motorcycles and the newly created one should be on the top of this list.*
5. **Timebox your debugging process**. Tell your reviewer that you will try to investigate this bug in no longer than 5 minutes as you do not want to use too much of the interview time.
    - For example: *Let me try to debug it. I do not want to use too much of this interview part, so let's see if I can investigate it in a maximum of 5 minutes.*
7. **After 5 minutes - report what you have learned about the bug and what the next steps would be**. Of course if the bug was trivial and you fixed it in 5 minutes you will only tell how you fixed the bug.
    - For example: *I can see that params are passed to the controller action but then the new object is not saved in the database. If I had more time, I would check what prevents saving the object - maybe it is due to validation?*
9. **Move on to the next part of the presentation and assure your interviewer that you will fix this bug after the interview**. Ask if it is ok to send them a follow-up message with the result of debugging.
   - For example: *As debugging this issue will take more time, let me move on to the next part of my presentation. I will continue my investigation after this meeting. Would it be ok to send you a follow-up email with the details once I fix this issue?*
 

---

*If you spot any bugs or issues in this activity, you can [open an issue with your proposed change](https://github.com/microverseinc/curriculum-transversal-skills/blob/main/git-github/articles/open_issue.md).*
