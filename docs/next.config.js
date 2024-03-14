module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/quickstart/exploring.mdx',
        permanent: true
      }
    ]
  }
}
