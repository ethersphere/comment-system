import { Bee, Utils } from '@ethersphere/bee-js'
import { BEE_DEBUG_URL, BEE_URL } from './constants/constants'
import { Comment } from './model/comment.model'
import { getUsableStamp } from './uitls/stamps'
import { getAddressFromUrl, getPrivateKeyFromUrl } from './uitls/url'
import { isComment } from './asserts/models.assert'
import { numberToFeedIndex } from './uitls/feeds'

export async function writeComment(url: string, comment: Comment) {
  const privateKey = getPrivateKeyFromUrl(url)

  // TODO Bee Debug URL should be configurable
  const stamp = await getUsableStamp(BEE_DEBUG_URL)

  if (!stamp) {
    throw new Error('No available stamps found.')
  }

  // TODO Bee URL should be configurable
  const bee = new Bee(BEE_URL)

  const { reference } = await bee.uploadData(stamp.batchID, JSON.stringify(comment))

  const feedWriter = bee.makeFeedWriter('sequence', Utils.keccak256Hash(getAddressFromUrl(url)), privateKey)

  await feedWriter.upload(stamp.batchID, reference)
}

export async function readComments(url: string): Promise<Comment[]> {
  // TODO Bee URL should be configurable
  const bee = new Bee(BEE_URL)

  const address = getAddressFromUrl(url)

  const feedReader = bee.makeFeedReader('sequence', Utils.keccak256Hash(address), address)

  const comments: Comment[] = []

  let nextIndex = 0

  while (true) {
    try {
      const feedUpdate = await feedReader.download({ index: numberToFeedIndex(nextIndex++) })

      const data = await bee.downloadData(feedUpdate.reference)

      // TODO assertComment, comments.push(...)
      const comment = data.json()

      if (isComment(comment)) {
        comments.push(comment)
      }
    } catch (error) {
      break
    }
  }

  return comments
}
