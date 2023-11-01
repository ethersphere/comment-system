import { writeComment, readComments } from '../src/index'

describe('Comments tests', () => {
  test('write and read comments to an url', async () => {
    const url =
      'http://localhost:1633/bzz/33d0d29ca4de6eac4b4d2a24c312ac838d1b914cc2b7e7e2eb3c6f4bdb0795c7/test/'
    await writeComment(url, { user: 'Xyz', data: 'Nice post' })
    await writeComment(url, { user: 'Abc', data: 'Typo in lorem ipsum' })
    const comments = await readComments(url)
    console.log(comments)

    expect(comments).toStrictEqual([
      { user: 'Xyz', data: 'Nice post' },
      { user: 'Abc', data: 'Typo in lorem ipsum' },
    ])
  })
})
