import { relations } from "drizzle-orm"
import {
  boolean,
  char,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { customAlphabet } from "nanoid"

const idLength = 12
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  idLength,
)

const id = () => char({ length: idLength })

// avoids code duplication
const object = () => ({
  id: id().$defaultFn(nanoid).primaryKey(),
})
const judiceObject = () => ({
  ...object(),
  judiceId: integer().unique().notNull(),
})

//

export const notification = pgTable("notifications", {
  ...object(),
  movimentationId: id().references(() => movimentation.id),
  clientId: id()
    .references(() => client.id)
    .notNull(),
  message: text().notNull(),
  sentAt: timestamp({ withTimezone: true, mode: "date" }),
  recieved: boolean().notNull(),
})

export const notificationRelations = relations(notification, ({ one }) => ({
  movimentation: one(movimentation, {
    fields: [notification.movimentationId],
    references: [movimentation.id],
  }),
  client: one(client, {
    fields: [notification.clientId],
    references: [client.id],
  }),
}))

//

export const publication = pgTable("publications", {
  ...judiceObject(),
  lawsuitId: id()
    .references(() => lawsuit.id)
    .notNull(),
  movimentationId: id(),
  expeditionDate: timestamp({
    withTimezone: true,
    mode: "date",
  }).notNull(),
  hasBeenTreated: boolean().default(false),
})

export const publicationRelations = relations(publication, ({ one, many }) => ({
  lawsuit: one(lawsuit, {
    fields: [publication.lawsuitId],
    references: [lawsuit.id],
  }),
  movimentation: one(movimentation, {
    fields: [publication.movimentationId],
    references: [movimentation.id],
  }),
}))

//

export const movimentationTypes = pgEnum("movimentation_types", [
  "AUDIENCIA",
  "PERICIA",
  /* TODO */
])

export const movimentation = pgTable("movimentations", {
  ...judiceObject(),
  lawsuitId: id()
    .references(() => lawsuit.id)
    .notNull(),
  type: movimentationTypes().notNull(),
  expeditionDate: timestamp({
    withTimezone: true,
    mode: "date",
  }).notNull(),
  finalDate: timestamp({ withTimezone: true, mode: "date" }).notNull(),
})

export const movimentationRelations = relations(
  movimentation,
  ({ many, one }) => ({
    lawsuit: one(lawsuit, {
      fields: [movimentation.lawsuitId],
      references: [lawsuit.id],
    }),
    notifications: many(notification),
  }),
)

//

export const client = pgTable("clients", {
  ...judiceObject(),
  name: text().notNull(),
  cpf: text(),
  phones: text().array().notNull(),
})

export const clientRelations = relations(client, ({ many }) => ({
  lawsuits: many(lawsuit),
}))

//

export const lawsuitStatus = pgEnum("lawsuit_status", [
  "NÃO INICIADO",
  "ATIVO",
  "ENCERRADO",
])

export const lawsuit = pgTable("lawsuits", {
  ...judiceObject(),
  cnj: text().notNull(),
  clientId: id()
    .references(() => client.id)
    .notNull(),
})

export const lawsuitRelations = relations(lawsuit, ({ one, many }) => ({
  client: one(client, { fields: [lawsuit.clientId], references: [client.id] }),
  movimentations: many(movimentation),
}))
