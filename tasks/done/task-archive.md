---
id: "bbae422c-56e9-42ed-ae4d-ca1fe2dca57d"
number: 23
title: "Task archive"
createdAt: "2025-12-06T19:56:46.601714Z"
updatedAt: "2025-12-07T16:18:52.363316Z"
assignees:
- "Claude Code"
categories:
- "frontend"
priority: "medium"
order: 1
---

# An archive for finished tasks

## Overview

The list of cards in the "done" column will be getting longer with time. To not create unnecessary clutter, only the latest N (configurable) cards that has been moved there should be visible in the "done" column.

We should therefore create a component that will open a dialog that contains a table that displays the tasks that are older than the Nth card. 

## Requirements

- The "done" column will display N latest cards that was moved to the column
   - N is configurable (property to the component), and has default value 5
- There should be a link or button at the bottom of the "done" column, titled "archived tasks", when clicked it should open a modal dialog
- The modal dialog should list the cards older than the Nth card in the done column
  - The dialog should contain a table, which is paginated, showing 10 rows at a time 
  - A table row should contain the title, the status, the last updated date and a link that will open the TaskDialog, displaying the all the details of the task, in read-only mode.  

## Acceptance Criteria

- [ ] Any tasks with status "done" older than the N (default 5) last cards is not listed in the done column
- [ ] Tasks with status "done" older than the N last card in the done column is displayed in the table that is displayed in the modal dialog
- [ ] New test are added
- [ ] Old and new tests are passing