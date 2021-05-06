import { useContext } from 'react'
//import { useRouter } from "next/router";
import AppContext from '@/context/app-context'
import mixpanel from 'mixpanel-browser'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComment as faCommentOutline } from '@fortawesome/free-regular-svg-icons'
import { faComment as faCommentSolid } from '@fortawesome/free-solid-svg-icons'
import Tippy from '@tippyjs/react'

const CommentButton = ({ item, handleComment }) => {
	const context = useContext(AppContext)
	const { isMobile } = context
	const comment_count = (context.myCommentCounts && context.myCommentCounts[item?.nft_id]) || item.comment_count
	const commented = context.myComments?.includes(item.nft_id)

	const handleLoggedOutComment = () => {
		mixpanel.track('Commented but logged out')
		context.setLoginModalOpen(true)
	}

	return (
		<Tippy content="Sign in to comment" disabled={context.user || isMobile}>
			<button onClick={context.user ? handleComment : handleLoggedOutComment}>
				<div className="flex flex-row items-center rounded-lg py-1 hover:text-stblue">
					<div className="mr-2 whitespace-nowrap">{comment_count}</div>
					<div className={`flex pr-1 ${commented ? 'text-stblue' : ''}`}>
						<FontAwesomeIcon className="!w-5 !h-5" icon={commented ? faCommentSolid : faCommentOutline} />
					</div>
				</div>
			</button>
		</Tippy>
	)
}

export default CommentButton