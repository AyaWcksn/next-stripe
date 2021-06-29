import {Router} from "next/dist/client/router";
import {useState} from "react";
import {CardElement} = from "@stripe/react-stripe-js";
import {Modal} from "react-bootstrap"
import React from 'react'
import {useElements, useStripe} from "@stripe/react-stripe-js";

const CheckoutForm = props => {
	const {getFieldDecorator} = props.form
	const [isLoading, setLoading] = useState(false)

	const stripe = useStripe()
	const element = useElements()

	const handleSubmit = async event => {
		event.preventDefault()

		props.form.validateFields(async (err, values) => {
			if(!err){
				setLoading(true)
				const result = await stripe.createPaymentMethod({
					type: "card",
					card: element.getElement(CardElement),
					billing_details: {
						address :{
							country: values.country
						},
						email: values.email,
						phone: values.phone,
						name: values.name
					}
				})
				await handleStripePaymentMethod(result)
				setLoading(false)
			}
		})
	}
	
	const handleStripePaymentMethod = async result => {
		if(result.error){
			Modal.error({
				title: "Error",
				content: result.error.message
			})
		} else {
			const response = await fetch('api/create-customer', {
				method: "POST",
				mode: "same-origin",
				body: JSON.stringify({
					paymentMethodId: result.paymentMethod.id
				})
			});

			const subscription = await response.json()
			handleSubscription(subscription)
		}
	}

	const handleSubscription = subscription => {
		const {latest_invoice} = subscription
		const {payment_intent} = latest_invoice

		if(payment_intent) {
			const {client_secret, status} = payment_intent
			if(status == "requires_action") {
				stripe.confirmCardPayment(client_secret).then(function(result) {
					if(result.error) {
						Modal.error({
							title: "Error"
							content: result.error.message
						})
					} else {
            // Success!
            Modal.success({
              title: "Success"
            });
          }
        });
			}
		}
	}
}

export default CheckoutForm
