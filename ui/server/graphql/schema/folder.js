const { gql } = require('apollo-server-express')
const cwd = require('../handler/cwd')
const folder = require('../handler/folder')

exports.types = gql`
  type MockItem {
    method: String
    url: String
    expectData: String
    isCustomFunc: Boolean
  }

  type Folder {
    name: String!
    path: String!
    children: [Folder]
    hidden: Boolean
    isDirectory: Boolean
    isMockConfig: Boolean
  }

  type Query {
    folderCurrent: Folder
  }

  type Mutation {
    folderOpen(path: String!): Folder
    folderOpenParent: Folder
    getMockConfig(path: String!): [MockItem]
  }
`

exports.resolves = {
  Folder: {
    children: _folder => folder.listChildren(_folder.path)
  },
  Query: {
    folderCurrent: () => folder.getCurrent()
  },
  Mutation: {
    folderOpen: (root, { path }) => folder.open(path),
    folderOpenParent: () => folder.openParent(cwd.get()),
    getMockConfig: (root, { path }) => folder.getMockConfig(path)
  }
}
