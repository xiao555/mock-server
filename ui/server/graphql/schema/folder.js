const { gql } = require('apollo-server-express')
const cwd = require('../handler/cwd')
const folder = require('../handler/folder')
const file = require('../handler/file')

exports.types = gql`
  type File {
    name: String!
    path: String!
    content: String
    isMockConfig: Boolean!
  }

  type Folder {
    name: String!
    path: String!
    children: [Folder]
  }

  type Query {
    folderCurrent: Folder
    folderExists(file: String!): Boolean
  }

  type Mutation {
    folderOpen(path: String!): Folder
    folderOpenParent: Folder
  }
`

exports.resolves = {
  File: {
    content: path => file.getFileContent(path),
    isMockConfig: path => file.isMockConfig(path)
  },
  Folder: {
    children: folder => folder.listChildren(folder.path)
  },
  Query: {
    folderCurrent: () => folder.getCurrent(),
    folderExists: path => folder.isDirectory(path)
  },
  Mutation: {
    folderOpen: path => folder.open(path),
    folderOpenParent: () => folder.openParent(cwd.get())
  }
}
