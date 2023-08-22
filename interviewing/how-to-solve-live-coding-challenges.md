# How to solve live coding challenges

## Learning objectives

- Solve simple interview-like coding challenges.
- Demonstrate ability to deal with common issues during the live coding session part of a technical interview.

### **Estimated time**: 0.5h

## Description

We will take a look at solving coding challenges from 2 angles, before we go into the exercise:

1. Why "jumping into coding immediately" is a bad approach
2. A 4 step approach to solving live coding challenges

### Why is "jumping into coding immediately" is bad approach?

To answer this we have to understand **the goal of a technical interview** from the perspective of an interviewer.

Whenever you're given a challenge, an interviewer is trying to assess the following: can this person...

- communicate their understanding of the question (or ask for clarification if they don't)?
- answer the question in a natural, thoughtful way (instead of rehearsed or forced)?
- share their thoughts on better ways of doing things?

They care about this because they're trying to **see if you know what you're doing**, as well as to **learn more about how you think**. This is not the same thing as "wanting to see the right answer". Often, it's not even about giving the right answer but **showing that you can collaborate** in order to come up with a basic solution and some suggestions for improvement.

### A 4 step approach to solving live coding challenges

So how do we better approach a live coding challenge? We recommend the following 4 steps (in order):

1. 💡 Understand - Make sure that you understand what the inputs and outputs should be
   - (optionally) Ask if you should take into account certain edge cases
2. 🗺 Plan - Create a plan of action ([in pseudocode](https://www.youtube.com/watch?v=qfckDdsEIq8))
3. 💬 Report - Communicate what you are doing while you're solving the problem
4. 🤔 Reflect - Analyze the algorithm and (1) share its efficiency using Big O and/or (2) propose how you could've solved it differently

Imagine you're asked to solve the following coding challenge: [Two Sum](https://leetcode.com/problems/two-sum/). Here's how you could approach it using the method described above:

```md
(💡 Understand) "So the algorithm should take 2 inputs: an array of integers ("nums") and a target integer ("target"). The output, or return value, should be an array of indices whose elements sum to the target integer. The instructions indicate a constraint: the algorithm is not allowed to use the same element twice... (etcetera)"

(🗺 Plan) "There are several ways of approaching this: a brute force solution with nested loops. This would mean I would make a sum of index i with every other element at index j and see if the result leads to the "target". However, a better solution would probably to use a hash table, like a list or object, as a And then I loop over the "nums" array... (etcetera)"

(💬 Report) "To implement the better solution, I'll first initialise an object and put it inside of a variable. I will use it to store all the individual "nums" values, including their index as a key - value pair. Then I loop over the "nums" aray... (etcetera)"

(🤔 Reflect) "As a final step I could analyze the efficiency of this algorithm using Big O notation. Since I made use of a hash table I have a O(1) lookup, as I can directly access any value inside of an object... (etcetera)"
```

