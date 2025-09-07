# Code Citations

## License: MIT
https://github.com/beingofexistence/dx/tree/c389df12f7f4c50183ab7b31f8e2be26ffb48eb2/inspirations/supabase/apps/docs/pages/guides/database/connecting-to-postgres.mdx

```
``ts
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'
```


## License: unknown
https://github.com/tomernahum/realtime-test/tree/26a7144b2d87513d651db4ca87101bcb3d624549/junk/drizzle-test/src/schema.ts

```
{ pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone:
```

