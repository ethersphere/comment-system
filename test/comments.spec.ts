import { writeComment, readComments } from '../src/index'

describe('Comments tests', () => {
  test('write and read comments to an url', async () => {
    const identifier = '/33d0d29ca4de6eac4b4d2a24c312ac838d1b914cc2b7e7e2eb3c6f4bdb0795c7/test/'
    await writeComment({ user: 'Xyz', data: 'Nice post' }, { identifier })
    await writeComment({ user: 'Abc', data: 'Typo in lorem ipsum' }, { identifier })
    const comments = await readComments({ identifier })

    expect(comments).toStrictEqual([
      { user: 'Xyz', data: 'Nice post' },
      { user: 'Abc', data: 'Typo in lorem ipsum' },
    ])
  })
})
