export type s3DataModel = {
  message: string
  user: string
  email: string
  filesUploaded: number
  files: object[]
}

export type fileInfoModel = {
  fileName: string
  fileType: string
  fileSize: string
  entityTag: string
  fileStatus: string
  s3Uri: string
}

export type s3ParamsModel = {
  Bucket: string
  Key: string
  Body: string
  ContentType: string
}

export type uploadInfoModel = {
  filesUploaded: number
  files: fileInfoModel[]
}

export type userInfoModel = {
  user: string
  email: string
}
