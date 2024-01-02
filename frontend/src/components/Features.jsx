import { CloudArrowUpIcon, LockClosedIcon, ServerIcon } from '@heroicons/react/20/solid'

const features = [
  {
    name: 'Intuitive Network Setup and Device Management.',
    description:
      'Easily create reservations, add, and manage devices for a comprehensive network setup.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Dynamic Network Visualization Interface.',
    description: 'Engage with a user-friendly canvas to drag, drop, and connect devices, crafting an accurate representation of any network.',
    icon: LockClosedIcon,
  },
  {
    name: 'Enhanced Security and Backup Solutions.',
    description: 'Trust in robust SSL encryption and reliable database backups to secure your network data.',
    icon: ServerIcon,
  },
]

export default function Features() {
  return (
    <div className="flex justify-center bg-white py-16 sm:py-20">
      <div className="ml-[-12rem] max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Rapid Network Deployment Tools</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Optimized Network Management Workflow</p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
              With Remote Lab, elevate your ability to visualize and manage networks effectively, no matter your role or requirement.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold text-gray-900">
                      <feature.icon className="absolute left-1 top-1 h-5 w-5 text-indigo-600" aria-hidden="true" />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <img
            src="https://i.postimg.cc/sDFfHPZL/Central-Lab.png"
            alt="Product screenshot"
            className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[55rem] md:-ml-4 lg:-ml-0"
            width={2432}
            height={1442}
          />
        </div>
      </div>
    </div>
  )
}