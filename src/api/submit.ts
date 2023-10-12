import { parse } from 'lambda-multipart-parser'
import { formatResponse, s3Upload } from '../helpers/util'
import { StatusCode } from '../helpers/enums'
import { fileInfoModel, s3DataModel, s3ParamsModel } from '../helpers/model'

export const handler = async (event) => {
  try {
    const username: string = event.headers.username
      ? event.headers.username
      : ''
    const result = await parse(event)
    const data: s3DataModel = {
      message: 'Successfully uploaded files to S3',
      owner: username,
      numberOfFiles: result.files.length,
      files: [],
    }
    // console.log('RESULT', result)

    for (let i = 0; i < result.files.length; i++) {
      const docFile = result.files[i]
      const docParam: s3ParamsModel = {
        Bucket: process.env.UPLOAD,
        Key: `images/${username}/${docFile.fieldname}-${new Date()
          .toISOString()
          .replace('.', '-')}-${docFile.filename
          .split(' ')
          .join('-')}`.toLowerCase(),
        Body: docFile.content,
        ContentType: docFile.contentType,
      }
      const uploadInfo = await s3Upload(docParam)
      const fileInfo: fileInfoModel = {
        fileName: docFile.fieldname,
        fileSize: uploadInfo.size,
        fileType: uploadInfo.type,
        entityTag: uploadInfo.eTag,
        fileStatus: uploadInfo.status,
        s3Uri: uploadInfo.location,
      }
      data.files.push(fileInfo)
      // console.log('UPLOAD RESULT', uploadInfo)
    }

    return formatResponse(StatusCode.SUCCESS, data)
  } catch (error) {
    console.error(error)

    return formatResponse(StatusCode.ERROR, error.message)
  }
}
