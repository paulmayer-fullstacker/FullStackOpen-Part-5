# Full Stack Open: Exercises for Part-5 - Bloglist Application

## Introduction:

Herewith my submission of the exercises required for Modul 5. Specifically, exercises 5.1 to 5.23 (inc.). These exercises progressively developed the frontend of the Bloglist application, and confirmed functionality through progressive automated testing. No formal specification was declared from the outset. So, the solution has evolved to this point (exercise submission).

---

## The Solution:
The solution consists of three distinct project files contained within my FullStackOpen-Part-5 repository:
- bloglist-backend-part4 (inherited from my FullStackOpen-Part-4).
- bloglist-frontend-main.
- bloglist-e2e-tests (containing a suit of Playwright end-to-end tests).

The scripts have been judiciously commented with inline documentation. So, we will not indulge in further explanation. We will simply cover the bare minimum information required to run and test the application.
The frontend (bloglist-frontend-main), developed in part-2, was updated to support the user management that was implemented to the backend in part 4. Once we had a functional application, combining back and front ends, part-5 lead us through a progressive scheme of testing (unit, integration, and end-to-end testing).  The ultimate test of functionality and user experience is defined within the end-to-end testing suite.

### End-to-End Testing
To run the end-to-end testing suit:
- Start the backend service (npm run start:test).
- Start the frontend (npm run dev).
- Start the end-to-end tests (npm test).
- 
Note: Commands are run from within the respective project’s root directory.

To mitigate networking issues, when working out of office, I installed and used MongoDB Compass. I found this tool very useful, for development testing, in removing potential network and latency issues.  

---

## Version Control

All three project files have been pushed to my GitHub repository at https://github.com/paulmayer-fullstacker/FullStackOpen-Part-5.
Tags have been used to identify key points in development: milestone/part5-exercises-5.1-5.4, milestone/part5-exercises-5.5-5.12, and milestone/part5-exercises-5.13-5.16. Development snapshots can be viewed at these tag points. The code currently available in the FullStackOpen-Part-5 main branch, represents development to (and including) exercise 5.23.

---

<br/>

<hr style="height: 5px; background-color: black; border: none;">
