const Contact = () => {
    return (
        <>
            <section className="w-full py-12 md:py-24 lg:py-32 bg-green-600 text-white">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Join us in creating a sustainable, bike-friendly future.
                        </h2>
                        <p className="mx-auto max-w-[600px] text-green-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Sign up for updates and be the first to know about BikeHood developments.
                        </p>
                    </div>
                    <div className="w-full max-w-sm space-y-2">
                        <form className="flex space-x-4">
                        <input className="max-w-lg flex-1 bg-white text-gray-900 px-4 py-2 rounded-md" placeholder="Enter your email" type="email" />
                        <button type="submit" className="text-gray-700 bg-gray-100 px-4 py-2 rounded-md font-semibold">Subscribe</button>
                        </form>
                    </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Contact