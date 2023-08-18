import React, { useLayoutEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

const removeTags = (str: string) => {
	if (str === null || str === '') return '';
	else str = str.toString();
	return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const endpoint = process.env.GRAPHQL_ENDPOINT as string;
	const graphQLClient = new GraphQLClient(endpoint);
	const pathArr = ctx.query.postpath as Array<string>;
	const path = pathArr.join('/');
	console.log(path);

	const query = gql`
		{
			post(id: "/${path}/", idType: URI) {
				id
				excerpt
				title
				link
				dateGmt
				modifiedGmt
				featuredImage {
					node {
						sourceUrl
						altText
					}
				}
			}
		}
	`;

	const data = await graphQLClient.request(query);
	if (!data.post) {
		return {
			notFound: true,
		};
	}

	return {
		props: {
			metaTags: {
				title: data.post.title,
				description: removeTags(data.post.excerpt).trim(),
				url: data.post.link,
				image: data.post.featuredImage.node.sourceUrl,
				imageAlt: data.post.featuredImage.node.altText,
				publishedTime: data.post.dateGmt,
				modifiedTime: data.post.modifiedGmt,
			} as MetaTags,
			host: ctx.req.headers.host
		},
	};
};

interface MetaTags {
	title: string
	description: string
	url: string
	image: string
	imageAlt?: string
	publishedTime: string
	modifiedTime: string
}

interface PostProps {
	metaTags: MetaTags
	host: string
}

const Post: React.FC<PostProps> = (props) => {
	const { metaTags, host } = props;

	useLayoutEffect(() => {
		window.location.href = metaTags.url;
	})

	return (
		<>
			<Head>
				<meta property="og:title" content={metaTags.title} />
				<meta property="og:description" content={metaTags.description} />
				<meta property="og:url" content={metaTags.url} />
				<meta property="og:type" content="article" />
				<meta property="og:locale" content="en_US" />
				<meta property="og:site_name" content={host.split('.')[0]} />
				<meta property="article:published_time" content={metaTags.publishedTime} />
				<meta property="article:modified_time" content={metaTags.modifiedTime} />
				<meta property="og:image" content={metaTags.image} />
				<meta
					property="og:image:alt"
					content={metaTags.imageAlt || metaTags.title}
				/>
				<title>{metaTags.title}</title>
			</Head>
		</>
	);
};

export default Post;
