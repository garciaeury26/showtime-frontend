import Head from 'next/head'
import PropTypes from 'prop-types'
//import backend from "../lib/backend";
import ScrollUp from './ScrollUp'
import Footer from './footer'
import Header from './header'

const Layout = ({ children }) => {
	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<Head>
				<link rel="icon" href="/logo_sm.jpg" />

				<meta name="keywords" content="showtime, ethereum, token, nft" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0" />

				<script async src="https://www.googletagmanager.com/gtag/js?id=G-EJP74KCP4M" />

				<script
					dangerouslySetInnerHTML={{
						__html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EJP74KCP4M');
        `,
					}}
				/>
			</Head>

			<Header />
			<div className="w-full mx-auto min-h-screen z-0">
				<ScrollUp />
				<main>{children}</main>
			</div>

			<Footer />
		</div>
	)
}

Layout.propTypes = {
	children: PropTypes.node.isRequired,
}

export default Layout