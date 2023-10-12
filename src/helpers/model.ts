export type s3DataModel = {
  message: string
  owner: string
  numberOfFiles: number
  files: fileInfoModel[]
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
