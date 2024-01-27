import { APIGatewayProxyEvent } from 'aws-lambda'
import { formatResponse, getUploadData, getUserData } from '../helpers/util'
import { ErrorType, StatusCode } from '../helpers/enums'

export const getUpload = async (event: APIGatewayProxyEvent) => {
  try {
    const uploadId = event.pathParameters.uploadId
    const userId = process.env.IS_OFFLINE
      ? event.headers.userId
      : event.requestContext.authorizer.claims.sub
    const result = await getUploadData(uploadId, userId)

    return formatResponse(StatusCode.SUCCESS, result)
  } catch (error) {
    console.error(error)

    return formatResponse(StatusCode.ERROR, ErrorType.API)
  }
}

export const getUser = async (event: APIGatewayProxyEvent) => {
  try {
    const userEmail = process.env.IS_OFFLINE
      ? event.headers.email
      : event.requestContext.authorizer.claims.email
    const userId = process.env.IS_OFFLINE
      ? event.pathParameters.userId
      : event.requestContext.authorizer.claims.sub

    console.log('EMAIL', userEmail)
    console.log('USER ID', userId)

    const result = await getUserData(userEmail)
    console.log('RESULT', result)

    return formatResponse(StatusCode.SUCCESS, result)
  } catch (error) {
    console.error(error)

    return formatResponse(StatusCode.ERROR, ErrorType.API)
  }
}
