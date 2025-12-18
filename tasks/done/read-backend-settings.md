---
id: "c7372c2c-0eba-4bf6-9079-3a323c67daca"
number: 42
title: "Read backend settings"
createdAt: "2025-12-18T20:00:55.852255Z"
updatedAt: "2025-12-18T20:13:33.267248Z"
assignees:
- "Claude Code"
categories: []
priority: "medium"
order: 1
---

# Read backend settings and display together with frontend settings

## Overview

The backend exposes its settings (which could be defined by a configuration file) via the API. The frontend should be able to read the settings and display them. The settings are read only, but it is useful for the user to get insight in the current settings of the backend. There is also a use case for the frontend where particular settings could define how the frontend should behave - for instance, when the support for PTYs are disabled in the backend, the frontend should also disable any features interfacing this.


## Requirements

- The API client is updated according to the new version of the OpenAPI spec
- The settings can be read by the client
- The dialog for frontend settings are updated to display a button, "Show backend settings"
- The settings are displayed in a new modal dialog
- The modal dialog contains a table with the key name, value and description as columns
- The table will scroll if there are many rows in the table

## Acceptance Criteria

- [ ] The settings is read from the API and displayed in a modal dialog
- [ ] Tests are run, new tests are added
- [ ] If applicable, New stories is added to the Storybook