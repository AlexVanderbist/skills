---
name: laravel-architecture
description: Guide the placement of Laravel application code across entry points, business domains, and external integrations when implementing or reviewing features.
---

# Laravel Architecture

Follow the project's existing namespaces and directory conventions. Do not create empty layers or directories in anticipation of future needs.

## Entry points

Controllers, commands, and MCP tools are thin entry points. Handle authorization and transport concerns, then delegate to domain code when appropriate.

One or two straightforward lines of business logic can stay inline. When the work becomes long or complicated, move it into a focused action or another appropriate class in the domain.

Keep HTTP and console entry points in their Laravel namespaces. Follow the project's conventions for MCP tools.

## Domain code

Group business code by domain. Keep related actions, models, jobs, data objects, enums, and exceptions together.

Use focused action classes for business operations. Give each action a name that explains the operation and follow the project's calling convention, such as an `execute()` method.

Make execution paths explicit. Do not use Laravel events, event subscribers, or model observers to coordinate application behavior. Call actions or other appropriate classes directly.

## Services and support

Keep external integrations and code that does not belong to a business domain outside the domain namespace.

Use the project's existing `Services` or `Support` namespace. External HTTP and API clients, such as a Stripe integration, usually belong here.

Consider Saloon for external API integrations. Follow the project's existing approach when it meets the requirements; do not add the package or migrate an integration solely to follow this preference.

Design each external integration so it could be extracted into a self-contained package:

- Define typed input and output objects within the integration.
- Keep provider-specific requests, authentication, serialization, and error handling inside it.
- Do not call application domain code.
- Do not call other application integrations.
- Let domain code coordinate operations that involve multiple integrations.

Do not actually extract a package unless the task calls for it.

## Example: blog with paid subscriptions

This tree illustrates placement and naming, not required boilerplate. Only create files and mappings that the feature needs.

```text
app/
├── Console/
│   └── Commands/
│       └── PublishScheduledPostsCommand.php
├── Http/
│   ├── Controllers/
│   │   ├── Posts/
│   │   │   ├── PostsController.php
│   │   │   └── PublishPostController.php
│   │   └── Subscriptions/
│   │       └── SubscriptionsController.php
│   ├── Requests/
│   │   ├── Posts/
│   │   │   ├── CreatePostRequest.php
│   │   │   └── UpdatePostRequest.php
│   │   └── Subscriptions/
│   │       └── CreateSubscriptionRequest.php
│   └── Resources/
│       ├── Posts/
│       │   └── PostResource.php
│       └── Subscriptions/
│           └── SubscriptionResource.php
├── Domain/
│   ├── Post/
│   │   ├── Actions/
│   │   │   ├── CreatePostAction.php
│   │   │   ├── UpdatePostAction.php
│   │   │   └── PublishPostAction.php
│   │   ├── Data/
│   │   │   └── PostData.php
│   │   ├── Enums/
│   │   │   └── PostStatus.php
│   │   ├── Exceptions/
│   │   │   └── PostCannotBePublished.php
│   │   └── Models/
│   │       ├── Post.php
│   │       └── Category.php
│   └── Subscription/
│       ├── Actions/
│       │   ├── CreateSubscriptionAction.php
│       │   └── CancelSubscriptionAction.php
│       ├── Data/
│       │   └── SubscriptionData.php
│       └── Models/
│           ├── Subscription.php
│           └── Plan.php
└── Services/
    └── Stripe/
        ├── StripeClient.php
        ├── Data/
        │   ├── CreateSubscriptionData.php
        │   └── StripeSubscriptionData.php
        └── Exceptions/
            └── StripeRequestFailed.php
```

- `Http/Requests` contains either Laravel `FormRequest` classes or Laravel Data classes with a `rules()` method for validation.
- `Http/Resources` contains either Laravel `JsonResource` classes or Laravel Data classes describing the response.
- Follow the project's established request and resource approach. The directory and naming conventions stay the same whichever implementation is used.
- Domain data objects represent inputs or values used by business operations. Domain actions do not depend on HTTP request or resource classes.
- Controllers and commands call the same domain actions. Both `PublishPostController` and `PublishScheduledPostsCommand` can call `PublishPostAction`.
- The subscription domain calls Stripe. Stripe accepts and returns its own typed objects; it does not know about the application's `Subscription` or `Plan` models.
