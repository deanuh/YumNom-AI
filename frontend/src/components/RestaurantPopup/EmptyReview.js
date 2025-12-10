//used when requests does not return any recent ratings.
export default function EmptyReview() {
	return (
		<li className="popupcomponent-reviews-entry empty"> 
			<p> There are no reviews yet.</p>
		</li>
	);
}
